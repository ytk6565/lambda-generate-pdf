import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const generatePdf = async () => {
  // Chromiumのグラフィックモードの設定を無効にする
  chromium.setGraphicsMode = false;

  // Puppeteerを使用してブラウザをランチするための設定
  const browser = await puppeteer.launch({
    args: process.env.IS_LOCAL
      ? puppeteer.defaultArgs()
      : [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-first-run",
          "--no-sandbox",
          "--no-zygote",
          "--single-process",
          "--proxy-server='direct://'",
          "--proxy-bypass-list=*",
          "--font-render-hinting=none",
        ],
    defaultViewport: chromium.defaultViewport,
    executablePath: process.env.IS_LOCAL
      ? ""
      : await chromium.executablePath(),
    // @ts-expect-error
    headless: process.env.IS_LOCAL ? false : chromium.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();

  // ダッシュボードにアクセスする
  await page.goto("http://127.0.0.1:3000/document?message=こんばんは", {
    waitUntil: "networkidle0",
  });

  // PDFを生成
  const pdfBuffer = await page.pdf({
    printBackground: true,
  });

  console.log("PDFが生成されました");

  // リソースをクリーンアップ
  await page.close();
  await browser.close();

  return pdfBuffer;
};

export { generatePdf };
