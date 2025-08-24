import { afterEach, describe, expect, test, vi } from "vitest";

import type { Context } from "aws-lambda";

import { S3Client } from "@aws-sdk/client-s3";

import { handler } from "..";

const {
  createBrowserMock,
  createBrowserCloseMock,
  generatePdfFactoryMock,
  uploadResultFilesToS3Mock,
  S3ClientMock,
} = vi.hoisted(() => {
  const createBrowserCloseMock = vi.fn();
  const generatePdfMock = vi.fn();

  return {
    createBrowserMock: vi.fn().mockImplementation(() => ({
      close: createBrowserCloseMock,
    })),
    createBrowserCloseMock,
    generatePdfFactoryMock: vi.fn().mockImplementation(() => generatePdfMock),
    uploadResultFilesToS3Mock: vi.fn(),
    S3ClientMock: vi.fn(),
  };
});

vi.mock("@aws-sdk/client-s3");

vi.mock("../src/createBrowser", () => {
  return {
    createBrowser: createBrowserMock,
  };
});

vi.mock("../src/generatePdf", () => {
  return {
    generatePdfFactory: generatePdfFactoryMock,
  };
});

vi.mock("../src/uploadResultFilesToS3", () => {
  return {
    uploadResultFilesToS3: uploadResultFilesToS3Mock,
  };
});

vi.mocked(S3Client).mockImplementation(S3ClientMock);

describe("pdf-generator", () => {
  const consoleErrorSpy = vi.spyOn(console, "error");
  const callbackMock = vi.fn();

  const createContextMock = (): Context => ({
    callbackWaitsForEmptyEventLoop: true,
    functionName: "functionName",
    functionVersion: "functionVersion",
    invokedFunctionArn: "invokedFunctionArn",
    memoryLimitInMB: "memoryLimitInMB",
    awsRequestId: "awsRequestId",
    logGroupName: "logGroupName",
    logStreamName: "logStreamName",
    getRemainingTimeInMillis: vi.fn(),
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ワークフローが失敗した場合", () => {
    test.skip("サーバーの処理に失敗した場合、エラーが発生すること", async () => {
      expect.assertions(6);

      await handler({}, createContextMock(), callbackMock);

      expect(createBrowserMock).toBeCalledTimes(1);

      expect(consoleErrorSpy).toBeCalledTimes(1);
      expect(consoleErrorSpy).toBeCalledWith(
        new Error("ワークフローが失敗しました"),
      );

      expect(callbackMock).toBeCalledTimes(1);
      expect(callbackMock).toBeCalledWith(null, {
        body: '{"error":"ワークフローが失敗しました"}',
        statusCode: 500,
      });

      expect(createBrowserCloseMock).toBeCalledTimes(1);
    });
  });
});
