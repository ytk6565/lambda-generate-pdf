import type { Browser } from "puppeteer-core";

import { execFile } from "node:child_process";
import { promises } from "node:fs";
import { promisify } from "node:util";

const OUTPUT_PDF_PATH = "/tmp/output.pdf";
const OUTPUT_ENCRYPTED_PDF_PATH = "/tmp/output-encrypted.pdf";

const promisifiedExecFile = promisify(execFile);

/**
 * PDF暗号化
 * @param inputPath 入力ファイルパス
 * @param outputPath 出力ファイルパス
 * @param ownerPassword オーナーパスワード
 */
async function encryptPdf(
  inputPath: string,
  outputPath: string,
  ownerPassword: string
) {
  try {
    const args = [
      "--encrypt",
      "userpass",
      ownerPassword,
      "256",
      "--print=none",
      "--modify=none",
      "--extract=n",
      "--annotate=n",
      "--",
      inputPath,
      outputPath,
    ];

    await promisifiedExecFile("qpdf", args);
  } catch (error) {
    console.error("PDF暗号化中にエラーが発生しました:", error);
    throw new Error("PDF暗号化に失敗しました");
  }
}

/**
 * PDF生成
 * @param browser ブラウザ
 * @param url URL
 * @returns PDFバッファ
 */
export const generatePdfFactory = (browser: Browser) => async (url: string) => {
  const page = await browser.newPage();

  // ダッシュボードにアクセスする
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  // PDFを生成
  await page.pdf({
    printBackground: true,
    path: OUTPUT_PDF_PATH,
  });

  await encryptPdf(
    OUTPUT_PDF_PATH,
    OUTPUT_ENCRYPTED_PDF_PATH,
    "owner-password"
  );

  console.log("PDFが生成されました");

  // リソースをクリーンアップ
  await page.close();
  await browser.close();

  // PDFバッファを返す
  const pdfBuffer = promises.readFile(OUTPUT_ENCRYPTED_PDF_PATH);

  return pdfBuffer;
};
