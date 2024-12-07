import type { Browser } from "puppeteer-core";

import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promises } from "node:fs";
import { promisify } from "node:util";

const OUTPUT_PDF_PATH = join(tmpdir(), "output.pdf");
const OUTPUT_ENCRYPTED_PDF_PATH = join(tmpdir(), "output-encrypted.pdf");

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
      '""', // 閲覧可能にするため、ユーザーパスワードは設定しない
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

  try {
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

    // PDFバッファを読み込む
    const pdfBuffer = await promises.readFile(OUTPUT_ENCRYPTED_PDF_PATH);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF処理中にエラーが発生しました:", error);
    throw error;
  } finally {
    // リソースのクリーンアップ
    await Promise.all([
      page.close(),
      promises.unlink(OUTPUT_PDF_PATH).catch(() => {}),
      promises.unlink(OUTPUT_ENCRYPTED_PDF_PATH).catch(() => {}),
    ]);
  }
};
