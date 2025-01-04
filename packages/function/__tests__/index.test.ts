import { afterEach, describe, expect, test, vi } from "vitest";

import type { Context } from "aws-lambda";

import { S3Client } from "@aws-sdk/client-s3";

import { handler } from "..";

const {
  createNuxtServerMock,
  createNuxtServerListenMock,
  createNuxtServerCloseMock,
  createBrowserMock,
  createBrowserCloseMock,
  generatePdfFactoryMock,
  uploadResultFilesToS3Mock,
  S3ClientMock,
} = vi.hoisted(() => {
  const createNuxtServerListenMock = vi.fn();
  const createNuxtServerCloseMock = vi.fn();
  const createBrowserCloseMock = vi.fn();
  const generatePdfMock = vi.fn();

  return {
    createNuxtServerMock: vi.fn().mockImplementation(() => ({
      listen: createNuxtServerListenMock,
      close: createNuxtServerCloseMock,
    })),
    createNuxtServerListenMock,
    createNuxtServerCloseMock,
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

vi.mock("../src/createNuxtServer", () => {
  return {
    createNuxtServer: createNuxtServerMock,
  };
});

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
    test("サーバーの処理に失敗した場合、エラーが発生すること", async () => {
      expect.assertions(8);

      createNuxtServerListenMock.mockImplementationOnce(() => {
        throw new Error("ワークフローが失敗しました");
      });

      await handler({}, createContextMock(), callbackMock);

      expect(createNuxtServerMock).toBeCalledTimes(1);

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

      expect(createNuxtServerCloseMock).toBeCalledTimes(1);

      expect(createBrowserCloseMock).toBeCalledTimes(1);
    });
  });

  describe("ワークフローが成功した場合", () => {
    test("サーバーが作成・起動・停止されること", async () => {
      expect.assertions(3);

      await handler({}, createContextMock(), callbackMock);

      expect(createNuxtServerMock).toBeCalledTimes(1);

      expect(createNuxtServerListenMock).toBeCalledTimes(1);

      expect(createNuxtServerCloseMock).toBeCalledTimes(1);
    });
  });
});
