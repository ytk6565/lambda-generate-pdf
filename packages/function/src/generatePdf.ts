import type { Browser } from "puppeteer-core";

import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promises } from "node:fs";
import { promisify } from "node:util";

import { PDFDocument } from "pdf-lib";

type Metadata = {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  producer: string;
  creator: string;
  creationDate: Date;
  modificationDate: Date;
};

const PAGE_NAVIGATION_TIMEOUT = 3000; // 3秒
const PDF_GENERATION_TIMEOUT = 10000; // 10秒

const outputPdfPath = join(tmpdir(), "output.pdf");
const outputEncryptedPdfPath = join(tmpdir(), "output-encrypted.pdf");

const promisifiedExecFile = promisify(execFile);

const setMetadata = async (
  buffer: Buffer,
  metadata: Metadata
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(buffer);

  pdfDoc.setTitle(metadata.title);
  pdfDoc.setAuthor(metadata.author);
  pdfDoc.setSubject(metadata.subject);
  pdfDoc.setKeywords(metadata.keywords);
  pdfDoc.setProducer(metadata.producer);
  pdfDoc.setCreator(metadata.creator);
  pdfDoc.setCreationDate(metadata.creationDate);
  pdfDoc.setModificationDate(metadata.modificationDate);

  return await pdfDoc.save();
};

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
): Promise<void> {
  try {
    const args = ["encrypt", `--opw`, ownerPassword, inputPath, outputPath];

    await promisifiedExecFile("pdfcpu", args);
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
      timeout: PAGE_NAVIGATION_TIMEOUT,
    });

    // PDFを生成
    const pdf = await page.pdf({
      printBackground: true,
      timeout: PDF_GENERATION_TIMEOUT,
    });

    // PDFメタデータを設定
    const pdfWithMetadata = await setMetadata(pdf, {
      title: "PDF Title",
      author: "PDF Author",
      subject: "PDF Subject",
      keywords: ["Keyword1", "Keyword2"],
      producer: "PDF Producer",
      creator: "PDF Creator",
      creationDate: new Date(),
      modificationDate: new Date(),
    });

    // PDFを保存
    await promises.writeFile(outputPdfPath, pdfWithMetadata);

    // PDFを暗号化
    await encryptPdf(outputPdfPath, outputEncryptedPdfPath, "owner-password");

    console.log("PDFが生成されました");

    // PDFバッファを読み込む
    const pdfBuffer = await promises.readFile(outputEncryptedPdfPath);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF処理中にエラーが発生しました:", error);
    throw error;
  } finally {
    // リソースのクリーンアップ
    await Promise.all([
      page.close(),
      promises.unlink(outputPdfPath).catch(() => {}),
      promises.unlink(outputEncryptedPdfPath).catch(() => {}),
    ]);
  }
};
