import type { Browser } from "playwright";

import { chromium } from "playwright";

/**
 * ブラウザの生成
 * @returns ブラウザ
 */
export const createBrowser = async (): Promise<Browser> => {
  const browser = await chromium.launch({
    args: process.env.IS_LOCAL
      ? [] // chromium.defaultArgs()
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
    headless: process.env.IS_LOCAL ? false : true,
    // @ts-expect-error
    ignoreHTTPSErrors: true,
  });

  return browser;
};
