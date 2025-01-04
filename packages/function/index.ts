import type { Handler } from "aws-lambda";

import { S3Client } from "@aws-sdk/client-s3";

import { createBrowser } from "./src/createBrowser";
import { createNuxtServer } from "./src/createNuxtServer";
import { generatePdfFactory } from "./src/generatePdf";
import { uploadResultFilesToS3 } from "./src/uploadResultFilesToS3";

const S3_BUCKET_NAME = "generate-pdf-documents";
const S3_FILE_PATH = "hello-world.pdf";
const PUPPETEER_BASE_URL = "http://localhost:3000";
const REQUEST_URL = `${PUPPETEER_BASE_URL}/document?message=Hello%20World`;
const UNKNOWN_ERROR_MESSAGE = "予期せぬエラーが発生しました";

const errorResponse = (error: Error) => {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error.message }),
  };
};

export const handler: Handler = async (_event, _context, callback) => {
  const s3Client = new S3Client({
    region: "ap-northeast-1",
    credentials:
      process.env.IS_LOCAL &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
  const server = createNuxtServer({
    serverFilePath: process.env.IS_LOCAL
      ? "../app/.output/server/index.mjs"
      : ".output/server/index.mjs",
  });
  const browser = await createBrowser();

  const generatePdf = generatePdfFactory(browser);

  try {
    server.listen((error, stdout, stderr) => {
      if (error) {
        throw error;
      }

      console.log(`Nuxt server stdout: ${stdout}`);
      console.error(`Nuxt server stderr: ${stderr}`);
    });

    const pdfBuffers = await generatePdf(REQUEST_URL);

    await uploadResultFilesToS3(
      s3Client,
      S3_BUCKET_NAME,
      S3_FILE_PATH,
      pdfBuffers,
    );

    console.log(`PDF uploaded to S3 with key: ${S3_FILE_PATH}`);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        s3FilePath: S3_FILE_PATH,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    callback(null, response);
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error(UNKNOWN_ERROR_MESSAGE);

    console.error(error);

    callback(null, errorResponse(error));
  } finally {
    browser.close();
    server.close();
  }
};
