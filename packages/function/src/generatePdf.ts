import type { Browser } from "puppeteer-core";

import { promises } from "node:fs";
import { exec } from "node:child_process";

const OUTPUT_PDF_PATH = "/tmp/output.pdf";
const OUTPUT_ENCRYPTED_PDF_PATH = "/tmp/output-encrypted.pdf";

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

  exec(
    `qpdf --encrypt "" ownerpass 256 --print=none --modify=none --extract=n --annotate=n -- ${OUTPUT_PDF_PATH} ${OUTPUT_ENCRYPTED_PDF_PATH}`,
    (error, stdout: string, stderr: string) => {
      if (error) {
        console.error(`エラーが発生しました: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`エラーが発生しました: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );

  console.log("PDFが生成されました");

  // リソースをクリーンアップ
  await page.close();
  await browser.close();

  // PDFバッファを返す
  const pdfBuffer = await promises.readFile(OUTPUT_ENCRYPTED_PDF_PATH);

  return pdfBuffer;
};
