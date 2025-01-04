import type { Browser } from "puppeteer-core";

import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

/**
 * ブラウザの生成
 * @returns ブラウザ
 */
export const createBrowser = async (): Promise<Browser> => {
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
      ? process.env.PUPPETEER_EXECUTABLE_PATH
      : await chromium.executablePath(),
    // @ts-expect-error
    headless: process.env.IS_LOCAL ? false : chromium.headless,
    ignoreHTTPSErrors: true,
    dumpio: true,
  });

  return browser;
};
