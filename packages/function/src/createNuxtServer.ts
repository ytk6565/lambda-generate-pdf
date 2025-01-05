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

  return {
    listen: async () => {
      return await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error("Timeout"));
        }, timeout);

        try {
          execProcess = execaNode(command, {
            cwd: process.env.IS_LOCAL ? "../app" : "",
          });

          execProcess?.stdout?.on("data", (data) => {
            console.log(data.toString());
          });

          execProcess?.stderr?.on("data", (data) => {
            console.error(data.toString());
          });

          execProcess?.on("SIGINT", close);
          execProcess?.on("SIGTERM", close);
          execProcess?.on("SIGQUIT", close);

          execProcess?.stdout?.on("data", (data) => {
            if (REGEXP_LISTENING.test(data.toString())) {
              clearTimeout(timer);
              resolve();
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    close,
  };
};
