import type { ExecException } from "node:child_process";

import { exec } from "node:child_process";

/**
 * Types
 */
type CreateNuxtServerOptions = {
  serverFilePath: string;
};

type ExecCallback = (
  error: ExecException | null,
  stdout: string,
  stderr: string,
) => void;

type NuxtServer = {
  listen: (callback: ExecCallback) => void;
  close: () => void;
};

type CreateNuxtServer = (options: CreateNuxtServerOptions) => NuxtServer;

/**
 * Nuxtサーバーの生成
 * @param options オプション
 * @returns Nuxtサーバー
 */
export const createNuxtServer: CreateNuxtServer = ({
  serverFilePath = ".output/server/index.mjs",
}) => {
  const command = `node ${serverFilePath}`;

  let execProcess: ReturnType<typeof exec> | undefined;

  return {
    listen: (callback) => {
      execProcess = exec(command, callback);
    },
    close: () => {
      execProcess?.kill();
    },
  };
};
