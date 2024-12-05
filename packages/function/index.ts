import type { Handler } from "aws-lambda";

import { createServer } from "node:http";

import { S3Client } from "@aws-sdk/client-s3";

import { createBrowser } from "./src/createBrowser";
import { generatePdfFactory } from "./src/generatePdf";
import { uploadResultFilesToS3 } from "./src/uploadResultFilesToS3";

import { listener } from "./.output/server/index.mjs";

const S3_BUCKET_NAME = "generate-pdf-documents";
const S3_FILE_PATH = "hello-world.pdf";
const REQUEST_URL = "http://0.0.0.0:3000/document?message=Hello%20World";

const errorResponse = (errorMessage: string) => {
  console.error(errorMessage);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: errorMessage }),
  };
};

export const handler: Handler = async (_event, _context, callback) => {
  const s3Client = new S3Client({ region: "ap-northeast-1" });
  const server = createServer(listener);
  const browser = await createBrowser();

  const generatePdf = generatePdfFactory(browser);

  try {
    server.listen(3000);

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
  } catch (error) {
    const message = `Error:·${error}`;

    callback(null, errorResponse(message));
  } finally {
    server.close();
  }
};
