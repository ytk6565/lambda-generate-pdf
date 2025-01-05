import type { ExecaChildProcess } from "execa";

import { execaNode } from "execa";

/**
 * RegExp
 */
const REGEXP_LISTENING = /Listening on /;

/**
 * Types
 */
type CreateNuxtServerOptions = {
  serverFilePath?: string;
  timeout?: number;
};

type NuxtServer = {
  listen: () => Promise<void>;
  close: () => void;
};

type CreateNuxtServer = (options?: CreateNuxtServerOptions) => NuxtServer;

/**
 * Nuxtサーバーの生成
 * @param options オプション
 * @returns Nuxtサーバー
 */
export const createNuxtServer: CreateNuxtServer = ({
  serverFilePath = ".output/server/index.mjs",
  timeout = 3000,
} = {}) => {
  const command = `${serverFilePath}`;

  let execProcess: ExecaChildProcess | undefined;

  const close = () => {
    execProcess?.kill();
  };

  process.on("SIGINT", close);
  process.on("SIGTERM", close);
  process.on("SIGQUIT", close);

  return {
    listen: async () => {
      execProcess = execaNode(command, {
        cwd: process.env.IS_LOCAL ? "../app" : "",
      });

      execProcess?.stdout?.on("data", (data) => {
        console.log(data.toString());
      });

      execProcess?.stderr?.on("data", (data) => {
        console.error(data.toString());
      });

      return await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timeout"));
        }, timeout);

        execProcess?.stdout?.on("data", (data) => {
          if (REGEXP_LISTENING.test(data.toString())) {
            clearTimeout(timer);
            resolve();
          }
        });
      });
    },
    close,
  };
};
