import type { Browser } from "puppeteer-core";

import { promisify } from "node:util";
import { promises } from "node:fs";
import { exec } from "node:child_process";

const OUTPUT_PDF_PATH = "/tmp/output.pdf";
const OUTPUT_ENCRYPTED_PDF_PATH = "/tmp/output-encrypted.pdf";

const promisifiedExec = promisify(exec);

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

  await promisifiedExec(
    `qpdf --encrypt "" ownerpass 256 --print=none --modify=none --extract=n --annotate=n -- ${OUTPUT_PDF_PATH} ${OUTPUT_ENCRYPTED_PDF_PATH}`,
  );

  console.log("PDFが生成されました");

  // リソースをクリーンアップ
  await page.close();
  await browser.close();

  // PDFバッファを返す
  const pdfBuffer = promises.readFile(OUTPUT_ENCRYPTED_PDF_PATH);

  return pdfBuffer;
};
