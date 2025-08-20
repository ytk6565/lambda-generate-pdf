import type { Browser } from "playwright";

import { execFile } from "node:child_process";
import { promises } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const outputPdfPath =
  process.env.IS_LOCAL && process.env.OUTPUT_PDF_PATH
    ? process.env.OUTPUT_PDF_PATH
    : join(tmpdir(), "output.pdf");
const outputEncryptedPdfPath =
  process.env.IS_LOCAL && process.env.OUTPUT_ENCRYPTED_PDF_PATH
    ? process.env.OUTPUT_ENCRYPTED_PDF_PATH
    : join(tmpdir(), "output-encrypted.pdf");

const promisifiedExecFile = promisify(execFile);

const setMetadata = async (
  buffer: Buffer,
  metadata: Metadata,
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
  ownerPassword: string,
): Promise<void> {
  try {
    const args = ["encrypt", "--opw", ownerPassword, inputPath, outputPath];

    // Ensure pdfcpu uses a writable config directory on Lambda
    const tmp = tmpdir();
    const xdgConfigHome = join(tmp, ".config");
    const pdfcpuConfigDir = join(xdgConfigHome, "pdfcpu");

    await promises.mkdir(pdfcpuConfigDir, { recursive: true });

    await promisifiedExecFile("pdfcpu", args, {
      env: {
        ...process.env,
        HOME: tmp,
        XDG_CONFIG_HOME: xdgConfigHome,
        PDFCPU_CONFIG_DIR: pdfcpuConfigDir,
      },
    });
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
      waitUntil: "domcontentloaded",
      timeout: PAGE_NAVIGATION_TIMEOUT,
    });

    page.on("pageerror", (error) => {
      console.error("(Browser) pageerror: ", error.message);
    });

    page.on("console", (msg) => {
      console.log("(Browser) console type: ", msg.type());
      console.log("(Browser) console text: ", msg.text());
      for (let i = 0; i < msg.args().length; ++i)
        console.log(`${i}: ${msg.args()[i]}`);
    });

    // PDFを生成
    const pdf = await page.pdf({
      printBackground: true,
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
      ...(process.env.IS_LOCAL
        ? []
        : [
            promises.unlink(outputPdfPath).catch(() => {}),
            promises.unlink(outputEncryptedPdfPath).catch(() => {}),
          ]),
    ]);
  }
};
