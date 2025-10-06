import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client"
import { WishDTO, WishDomainPartial } from "shared-schemas";
import { fromB64ToResizedUInt8Array, getImageAsUint8Array, resizeAndConvert } from "./image-processing";
import { initDb } from "./init/init";
import { Worker } from 'worker_threads';
import { SERIALIZABLE_SEARCH_ENGINE, SerializableSearchLocators } from './api-get-image/search_const';
import path from "path";
import z from "zod";
import { OptionalRedis } from "./redis";

const express = require("express");
const app = express();
const prisma = new PrismaClient();

const redis_client = new OptionalRedis();

async function initializeServices() {
  if (process.env.NODE_ENV !== 'test' && process.env.POSTGRES_DB !== 'testdatabase') {
    console.log('Starting database initialization...');
    await initDb(prisma);
    console.log('✅ Database initialization completed successfully');
  } else {
    console.log('Skipping database initialization in test environment');
  }

  await redis_client.initialize({
    url: process.env.REDIS_URL || ''
  });
  console.log('✅ Services initialization completed');
}

initializeServices().catch(error => {
  console.error('❌ Services initialization failed:', error);
  process.exit(1);
});

const cors = require('cors');

app.use(
  cors({
    credentials: true,
    preflightContinue: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: true
  }),
  express.json({ limit: '50mb' })
);



function isNumber(maybe_number: string): boolean {
  for (const c of maybe_number) {
    if ('0' > c || c > '9') {
      return false;
    }
  }
  return true;
}

app.get("/status", (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/all-wishes", async (req: Request, res: Response) => {
  const allWishes = await prisma.wish.findMany();
  const allWishesToSend = []
  for (const wish of allWishes) {
    const picture = Buffer.from(wish.picture).toString('base64');
    const createdAt = wish.createdAt.toISOString()
    allWishesToSend.push({ ...wish, picture, createdAt })
  }
  const payload = WishDTO.array().parse(allWishesToSend);

  res.status(200).json(payload)
});

app.post("/new-wish", async (req: Request, res: Response) => {
  if (req.body.picture) {
    req.body.picture = await fromB64ToResizedUInt8Array(req.body.picture);
  }
  else {
    req.body.picture = new Uint8Array();
  }

  req.body.createdAt = new Date(req.body.createdAt);
  const newWish = { createdAt: new Date(), name: "", tags: [], comment: "", picture: new Uint8Array(), ...req.body };
  await prisma.wish.create({
    data: newWish
  })
  res.sendStatus(204);
});

app.patch("/update-wish", async (req: Request, res: Response) => {
  if (req.body.picture) {
    req.body.picture = await fromB64ToResizedUInt8Array(req.body.picture);
  }
  if (!req.body.id) {
    throw ('/update-wish needs an id in the body');
  }
  const id = req.body.id;
  delete req.body.id;
  const WishInDb = WishDomainPartial.parse(req.body);
  await prisma.wish.update({
    where: {
      id,
    },
    data: WishInDb,
  })
  const updatedWish = await prisma.wish.findUnique({
    where: {
      id,
    },
  })
  if (!updatedWish) {
    res.sendStatus(404);
    return;
  }

  const picture = Buffer.from(updatedWish.picture).toString('base64');
  const createdAt = updatedWish.createdAt.toISOString()
  const tmp = { ...updatedWish, picture, createdAt };
  const payload = WishDTO.parse(tmp);
  res.status(200).json(payload);
});

app.delete("/delete-wish/:id", async (req: Request, res: Response) => {
  if (req.params.id.length == 0 || !isNumber(req.params.id)) {
    res.sendStatus(400);
    return;
  }
  await prisma.wish.delete({
    where: {
      id: Number(req.params.id),
    },
  })
  res.sendStatus(204);
});

app.post("/convert-image", async (req: Request, res: Response) => {
  const converted_picture = await fromB64ToResizedUInt8Array(req.body.image_base64);
  const converted_pictureB64 = Buffer.from(converted_picture).toString('base64');
  res.status(200).json(converted_pictureB64);
})

// function only used to debug frontend
async function processByWorkerMock(search_locators: SerializableSearchLocators, search_term: string): Promise<Uint8Array> {
  try {
    if (search_locators.name == "GOOGLE") {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    if (search_locators.name == "BING") {
      await new Promise(resolve => setTimeout(resolve, 600000000));
    }
    if (search_locators.name == "BRAVE") {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    const image_path = path.join(process.cwd(), 'build', 'init', 'images', "Another-Kingdom.jpg");
    const tosend = await resizeAndConvert(getImageAsUint8Array(image_path));
    return tosend;
  } catch (err) {
    throw new Error(`${search_locators.name} failed to search for ${search_term} ; ${err}`);
  }
}

async function processByWorker(search_locators: SerializableSearchLocators, search_term: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'api-get-image', 'worker.js'));

    worker.postMessage({ search_locators, search_term });

    worker.on('message', (result: Uint8Array) => {
      worker.terminate();
      resolve(result);
    });

    worker.on('error', (error) => {
      worker.terminate();
      reject(new Error(`${search_locators.name} failed to search for "${search_term}": ${error.message}`));
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

app.get("/search/:search_term", async (req: Request, res: Response) => {

  if (!req.params.search_term) {
    res.sendStatus(400);
    return;
  }
  const search_term = req.params.search_term;
  

  // Send the result as SSE data
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  const data = await redis_client.get(search_term);
  let retrieved_from_cache = false;
  const res_from_cache = data ? z.string().array().parse(JSON.parse(data)) : null;

  if (res_from_cache) {
    console.log("cache hit")
    retrieved_from_cache = true;
    for (let cache_image_base64 of res_from_cache) {
      res.write(`data: ${JSON.stringify({ image: cache_image_base64 })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();
    return
  }
  let completedEngines = 0;
  const totalEngines = SERIALIZABLE_SEARCH_ENGINE.length;

  const checkCompletion = () => {
    if (completedEngines === totalEngines) {
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      res.end();
    }
  };

  const res_to_cache: string[] = []

  // Starting all workers in parallel
  for (const searchEngine of SERIALIZABLE_SEARCH_ENGINE) {
    processByWorker(searchEngine, search_term)
      .then((result) => {
        const res_base64 = Buffer.from(result).toString('base64');
        res_to_cache.push(res_base64);

        res.write(`data: ${JSON.stringify({ image: res_base64 })}\n\n`);
        completedEngines++;
        checkCompletion();
      })
      .catch((error) => {
        console.error(`Error processing ${searchEngine.name}:`, error);
        completedEngines++;
        checkCompletion();
      });
  }

  req.on('close', () => {
    if (!retrieved_from_cache) {
      redis_client.set(search_term, JSON.stringify(res_to_cache));
    }
    res.end();
  });
})

const argv: { p?: number, port?: number } = require('minimist')(process.argv.slice(2));
let PORT = 3000;
if (argv.p) { PORT = argv.p }
if (argv.port) { PORT = argv.port }

const server = app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`🛑 ${signal} received, shutting down gracefully...`);
  server.close(async () => {
    console.log(' HTTP server closed');

    try {
      await prisma.$disconnect();
      console.log('Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }

    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));