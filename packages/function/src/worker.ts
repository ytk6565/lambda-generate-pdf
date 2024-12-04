import { parentPort, workerData } from "worker_threads";

import { generatePdf } from "./generatePdf";
import { uploadResultFilesToS3 } from "./uploadResultFilesToS3";

import { S3Client } from "@aws-sdk/client-s3";

const BUCKET = "generate-pdf-documents";
const s3 = new S3Client({ region: "ap-northeast-1" });

const errorResponse = (errorMessage: string) => {
  console.error(errorMessage);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: errorMessage }),
  };
};

(async () => {
  try {
    const pdfBuffers = await generatePdf(workerData.url);

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

    parentPort?.postMessage(response);
  } catch (error) {
    const message = "Error: " + error;

    parentPort?.postMessage(errorResponse(message));
  }
})();
