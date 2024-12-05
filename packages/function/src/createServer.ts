import type { ChildProcess } from "node:child_process";
import { exec } from "node:child_process";

type CreateServer = (endpoint: string) => {
  start: () => void;
  stop: () => void;
};

/**
 * サーバーの生成
 * @param endpoint エンドポイント
 * @returns サーバー
 */
const createServer: CreateServer = (endpoint: string) => {
  let cp: ChildProcess | null = null;

  const stop = () => {
    cp?.stdin?.write("stop\n");
    cp?.kill();
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("SIGQUIT", stop);

  const start = () => {
    cp = exec(`node ${endpoint}`, (error, stdout, stderr) => {
      if (error) {
        console.error("Error: ", error);
        return;
      }
      console.log("stdout: ", stdout);
      console.log("stderr: ", stderr);
    });
  };

  return {
    start,
    stop,
  };
};

export { createServer };
