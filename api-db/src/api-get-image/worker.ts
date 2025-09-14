import { resizeAndConvert } from "../image-processing";
import { ImageFetcher, LocatorFunctions } from "./api-get-image";
import { SearchLocators, SerializableSearchLocators, getLocatorBigImage } from "./search_const";

const { parentPort } = require('worker_threads');
const fs = require('fs');

parentPort.on('message', 
	async (
		{search_locators, search_term}  : 
		{search_locators:SerializableSearchLocators, search_term: string}
	) => {
		const imageFetcher = await ImageFetcher.create();
		
		const fullSearchLocators: SearchLocators = {
			...search_locators,
			locatorBigImage: (page: any) => getLocatorBigImage(search_locators.locatorBigImage, page)
		};
		
		const locatorFunctions = new LocatorFunctions({
			page:imageFetcher.page,
			search_locators: fullSearchLocators
		})
		const buffer =  await imageFetcher.downloadImage(locatorFunctions,  search_term);
		let converted = new Uint8Array() ;
		if (buffer) {
			converted = await resizeAndConvert(buffer);
		}
			
		parentPort.postMessage(converted);
});