import { handler } from "../../dist/index.mjs";

/** @type {import('aws-lambda').SQSEvent} */
const makeEvent = () => ({
  Records: [],
});

/** @returns @type {import('aws-lambda').SQSEvent} */
const makeArg = () => ({
  ...makeEvent(),
});

// @ts-expect-error
handler(makeArg(), {}, (error, result) => {
  console.log(error, result);
});
