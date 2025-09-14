import sharp from "sharp";

import { readFileSync } from 'fs';

export function getImageAsUint8Array(imagePath:string) {
  try {
    const imageData = readFileSync(imagePath);
    return new Uint8Array(imageData);
  } catch (error) {
    return new Uint8Array();
  }
}

export async function resizeAndConvert(imageBuffer: Uint8Array) {
	if(imageBuffer.length === 0) {
		return new Uint8Array() ;
	}
	return new Uint8Array(
		await sharp(imageBuffer)
			.resize(200, 300, {
				position : sharp.strategy.attention 
			})
			.webp({ quality: 60 })
			.toBuffer()
	) ;
}

export async function fromB64ToResizedUInt8Array(picture: string) : Promise<Uint8Array> {
	const buffer = Buffer.from(picture, 'base64');
	const bufferUint8Array = new Uint8Array(buffer);
	return resizeAndConvert(bufferUint8Array) ;
}