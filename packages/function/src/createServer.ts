import type { ChildProcess } from "child_process";
import { exec } from "child_process";

const createServer = (endpoint: string) => {
  let cp: ChildProcess | null = null;

  const stop = () => {
    cp?.stdin?.write("stop\n");
    cp?.kill();
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("SIGQUIT", stop);

  const start = () => {
    cp = exec(`NITRO_PORT=3001 node ${endpoint}`, (error, stdout, stderr) => {
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
