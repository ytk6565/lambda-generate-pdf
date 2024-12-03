import type { Handler } from "aws-lambda";

import { createServer } from 'node:http'
import { S3Client } from "@aws-sdk/client-s3";
import { generatePdf } from "./src/generatePdf";
import { uploadResultFilesToS3 } from "./src/uploadResultFilesToS3";
import { listener } from './.output/server'

const BUCKET = "generate-pdf-documents";
const s3 = new S3Client({ region: "ap-northeast-1" });

const errorResponse = (errorMessage: string) => {
  console.error(errorMessage);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: errorMessage }),
  };
};

export const handler: Handler = async (_event, _context, callback) => {
  const server = createServer(listener)
  
  try {
    server.listen(3000)

    const pdfBuffers = await generatePdf();

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
  } finally {
    server.close()
  }
};

// @ts-expect-error
handler({}, {}, (_error, result) => {
  console.log(result);
});
