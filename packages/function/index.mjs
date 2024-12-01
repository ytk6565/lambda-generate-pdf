"use strict";

import { S3Client } from "@aws-sdk/client-s3";
import { createServer } from "./src/createServer.mjs";
import { generatePdf } from "./src/generatePdf.mjs";
import { uploadResultFilesToS3 } from "./src/uploadResultFilesToS3.mjs";

const BUCKET = "generate-pdf-documents";
const s3 = new S3Client({ region: "ap-northeast-1" });

const errorResponse = (errorMessage) => {
  console.error(errorMessage);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: errorMessage }),
  };
};

export const handler = async (_event, _context, callback) => {
  try {
    const server = createServer(".output/server/index.mjs");

    server.start();

    const pdfBuffers = await generatePdf();

    server.stop();

    if (!pdfBuffers) {
      throw new Error("Failed to generate pdf");
    }

    const { pdfS3Key } = await uploadResultFilesToS3(s3, BUCKET, pdfBuffers);

    console.log(`PDF uploaded to S3 with key: ${pdfS3Key}`);

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        pdfS3Key,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };

    callback(null, response);
  } catch (error) {
    const message = "Error: " + error;

    callback(null, errorResponse(message));
  }
};

handler({}, {}, (_error, result) => {
  console.log(result);
});
