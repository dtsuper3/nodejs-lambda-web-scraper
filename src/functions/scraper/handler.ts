import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';
import axios from "axios";
import * as cheerio from "cheerio";

const scraper: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  if (event.headers.apikey !== "kakashihatake") {
    return formatJSONResponse({
      message: "User Unauthorized",
    }, 401);
  }
  if (!event.body?.url) {
    return formatJSONResponse({
      message: "Url is required",
    }, 400);
  }

  const d = await axios.get(event.body.url);
  const $ = cheerio.load(d.data);
  const scrapeData = {} as any;
  scrapeData.images = [];
  scrapeData.url = event.body?.url;
  scrapeData.dateOfExtraction = new Date();
  scrapeData.title = $("title").text();
  scrapeData.description = $("meta[name='description']").attr("content");
  $("img").each((_i, image) => {
    scrapeData.images.push({
      url: $(image).attr("src"),
      alt: $(image).attr("alt"),
    });
  });

  return formatJSONResponse({
    data: scrapeData
  });
};

export const main = middyfy(scraper);
