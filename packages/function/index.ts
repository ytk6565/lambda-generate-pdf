import type { Handler } from "aws-lambda";

import { createServer } from "node:http";
import { Worker } from "node:worker_threads";

import { listener } from "./.output/server/index.mjs";

const errorResponse = (errorMessage: string) => {
  console.error(errorMessage);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: errorMessage }),
  };
};

export const handler: Handler = async (_event, _context, callback) => {
  const server = createServer(listener);

  try {
    server.listen(3000);

    return new Promise((resolve, reject) => {
      const worker = new Worker("./worker.js", { workerData: { url } });

      worker.on("message", (data) => resolve(data));
      worker.on("error", (err) => reject(err));
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    }).then((data) => callback(null, data));
  } catch (error) {
    const message = "Error: " + error;

    callback(null, errorResponse(message));
  } finally {
    server.close();
  }
};

// @ts-expect-error
handler({}, {}, (_error, result) => {
  console.log(result);
});
