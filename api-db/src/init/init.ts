import { PrismaClient } from "@prisma/client";
import { INIT_DATA } from "./data/data";
import path from "path";
import { promises as fs } from "fs";


async function isDbAlreadyInit(prisma: PrismaClient) {
  try {
    const count = await prisma.init.count();
    return count > 0;
  } catch (error) {
    console.error('Error checking init status:', error);
    return false;
  }
}


async function loadImageData(imageFolder: string, imageFileName: string): Promise<Uint8Array> {
  const imagePath = path.join(__dirname, imageFolder, imageFileName);
  const buffer = await fs.readFile(imagePath);
  return new Uint8Array(buffer);
}

export async function initDb(prisma: PrismaClient) {
  if (await isDbAlreadyInit(prisma)) {
    return;
  }
  
  await prisma.init.create({ data: {} });
  
  await Promise.all(INIT_DATA.map(async (wish) => {
    await prisma.wish.create({
      data: {
        name: wish.name,
        comment: wish.comment,
        createdAt: new Date(wish.createdAt).toISOString(),
        tags: wish.tags,
        picture: await loadImageData("data/",wish.imageFile),
      }
    });
  }));    
}