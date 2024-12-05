import type { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * S3にファイルをアップロード
 * @param s3Client S3クライアント
 * @param s3BucketName S3バケット名
 * @param s3FilePath S3ファイルパス
 * @param pdfBuffer PDFバッファ
 */
export const uploadResultFilesToS3 = async (
  s3Client: S3Client,
  s3BucketName: string,
  s3FilePath: string,
  pdfBuffer: Buffer | undefined,
): Promise<void> => {
  if (!pdfBuffer) {
    throw new Error("PDF buffer is null or undefined");
  }

  console.log("Uploading files to S3...");

  console.log(`PDF S3 filepath: ${s3FilePath}`);

  try {
    // PDFファイルをS3にアップロード
    const putPdfCommand = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: s3FilePath,
      Body: pdfBuffer,
      ContentType: "application/pdf",
    });

    await s3Client.send(putPdfCommand);
    console.log(`PDF file uploaded successfully: ${s3FilePath}`);
  } catch (error) {
    console.error(`Error uploading files to S3: ${error}`);
    // @ts-expect-error
    throw new Error(`Failed to upload files to S3: ${error?.message}`);
  }
};
