import type { Browser } from "puppeteer-core";

// import { Writable } from "node:stream";

// import PDFDocument from "pdfkit";

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
  const pdfBuffer = await page.pdf({
    printBackground: true,
  });

  // // PDFを暗号化
  // const stream = new Writable();

  // stream.write(pdfBuffer);

  // const doc = new PDFDocument({
  //   ownerPassword: "owner",
  //   userPassword: "user",
  //   permissions: {
  //     printing: "highResolution",
  //     modifying: false,
  //     copying: false,
  //     annotating: false,
  //     fillingForms: false,
  //     contentAccessibility: false,
  //     documentAssembly: false,
  //   },
  // });
  // doc.pipe(stream);
  // doc.end();

  console.log("PDFが生成されました");

  // リソースをクリーンアップ
  await page.close();
  await browser.close();

  return pdfBuffer;
};
