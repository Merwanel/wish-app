import path from "path";
import { getImageAsUint8Array, resizeAndConvert } from "../image-processing";
import { INIT_DATA } from "./data";

async function convert(image_folder: string, out_dir: string) {
  const fs = require("fs").promises;
  
  if (out_dir.length && out_dir[0] != "/") {
    out_dir = path.join(process.cwd(), out_dir);
  }
  
  await fs.mkdir(out_dir, { recursive: true });
  
  if (image_folder.length && image_folder[0] != "/") {
    image_folder = path.join(process.cwd(), image_folder);
  }

  const dataEntries = [];
  
  for (let i = 0; i < INIT_DATA.length; i++) {
    const wish = INIT_DATA[i];
    const image_path = path.join(image_folder, wish.picture_path);
    const converted_image = await resizeAndConvert(getImageAsUint8Array(image_path));

    const binaryFileName = `img_${i}.bin`;
    const binaryFilePath = path.join(out_dir, binaryFileName);
    await fs.writeFile(binaryFilePath, Buffer.from(converted_image));
    
    dataEntries.push({
      name: wish.name,
      comment: wish.comment,
      createdAt: wish.createdAt,
      tags: wish.tags,
      imageFile: binaryFileName
    });
  }
  
  const formatEntry = (entry: any) => {
    return `  {
    name: ${JSON.stringify(entry.name)},
    comment: ${JSON.stringify(entry.comment)},
    createdAt: ${JSON.stringify(entry.createdAt)},
    tags: ${JSON.stringify(entry.tags)},
    imageFile: ${JSON.stringify(entry.imageFile)}
  }`;
  };
  
  const dataContent = `export const INIT_DATA = [
${dataEntries.map(formatEntry).join(',\n')}
] ;`;
  
  await fs.writeFile(path.join(out_dir, 'data.ts'), dataContent);  
}

async function imageToBinary(imagePath: string, outputPath: string) {
  const fs = require("fs").promises;
  const converted_image = await resizeAndConvert(getImageAsUint8Array(imagePath));
  await fs.writeFile(outputPath, Buffer.from(converted_image));
}


const argv: { f?: string, folder?: string, o?: string, image?: string, output?: string } = require('minimist')(process.argv.slice(2));

if (argv.image && argv.output) {
  imageToBinary(argv.image, argv.output);
} else {
  let image_folder = "";
  let out_dir = "src/init/data";
  
  if (!argv.f && !argv.folder) {
    throw("require -f or -folder");
  }
  if (argv.f) { image_folder = argv.f; }
  if (argv.folder) { image_folder = argv.folder; }
  if (argv.o) { out_dir = argv.o; }
  
  convert(image_folder, out_dir);
}