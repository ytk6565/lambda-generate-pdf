import type { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const uploadResultFilesToS3 = async (
  s3: S3Client,
  bucketName: string,
  pdfBuffer: Buffer | undefined
) => {
  if (!pdfBuffer) {
    throw new Error("PDF buffer is null or undefined");
  }

  console.log("Uploading files to S3...");

  // S3にアップロードするためのユニークなキーを生成
  const pdfS3Key = `documents/${uuidv4()}.pdf`;

  console.log(`PDF S3 key: ${pdfS3Key}`);

  try {
    // PDFファイルをS3にアップロード
    const putPdfCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: pdfS3Key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    });

    await s3.send(putPdfCommand);
    console.log(`PDF file uploaded successfully: ${pdfS3Key}`);

    // S3キーを返す
    return {
      pdfS3Key,
    };
  } catch (error) {
    console.error(`Error uploading files to S3: ${error}`);
    throw new Error(`Failed to upload files to S3: ${error.message}`);
  }
};
