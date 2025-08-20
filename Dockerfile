# Docs: https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/nodejs-image.html#nodejs-image-clients

ARG BUILD_DIR="/build"
ARG LIBRARY_DIR="/lib"
ARG FUNCTION_DIR="/function"

# ------------------------------------------------------------
# ビルド
# ------------------------------------------------------------

FROM node:22.13.1 AS build-image

ARG BUILD_DIR
ARG APP_ENV_ARG="staging"
ENV APP_ENV=${APP_ENV_ARG}

# コードをコピー
RUN mkdir -p ${BUILD_DIR}
COPY . ${BUILD_DIR}

WORKDIR ${BUILD_DIR}

RUN npm ci
RUN npm run build -w packages/app
RUN npm run build -w packages/function

# ------------------------------------------------------------
# ライブラリのインストール
# ------------------------------------------------------------

FROM node:22.13.1 AS library-image

ARG LIBRARY_DIR
ENV PDFCPU_VERSION=0.5.0

# ビルド依存関係をインストール
RUN apt-get update && \
    apt-get install -y \
    g++ \
    make \
    cmake \
    unzip \
    libcurl4-openssl-dev

# コードをコピー
RUN mkdir -p ${LIBRARY_DIR}

WORKDIR ${LIBRARY_DIR}

RUN wget "https://github.com/pdfcpu/pdfcpu/releases/download/v${PDFCPU_VERSION}/pdfcpu_${PDFCPU_VERSION}_Linux_x86_64.tar.xz"
RUN tar -xvf "pdfcpu_${PDFCPU_VERSION}_Linux_x86_64.tar.xz"
RUN mkdir ${LIBRARY_DIR}/bin/
RUN mv "pdfcpu_${PDFCPU_VERSION}_Linux_x86_64/pdfcpu" ${LIBRARY_DIR}/bin/

COPY ./packages/function/package.json ${LIBRARY_DIR}

RUN npm install
RUN npm install aws-lambda-ric

# ------------------------------------------------------------
# Lambda ランタイムイメージ
# ------------------------------------------------------------

# 新しい slim イメージを取得して、最終的なサイズを削減する
FROM node:22.13.1-slim

# npm@8.6.0+ を使用する Node ランタイムに必要
# デフォルトでは npm は /home/.npm にログを書き込むため、Lambda のファイルシステムは読み取り専用
ENV NPM_CONFIG_CACHE=/tmp/.npm

# このステージのビルドにグローバル引数を含める
ARG BUILD_DIR
ARG LIBRARY_DIR
ARG FUNCTION_DIR

# 関数のルートディレクトリを設定
WORKDIR ${FUNCTION_DIR}

# ビルド済みの依存関係をコピー
COPY --from=build-image ${BUILD_DIR}/packages/app/.output/ ${FUNCTION_DIR}/.output/
COPY --from=build-image ${BUILD_DIR}/packages/function/dist/index.mjs ${FUNCTION_DIR}
COPY --from=library-image ${LIBRARY_DIR}/bin/ /bin/
COPY --from=library-image ${LIBRARY_DIR}/node_modules/ ${FUNCTION_DIR}/node_modules/
COPY --from=library-image ${LIBRARY_DIR}/package.json ${FUNCTION_DIR}
COPY --from=library-image ${LIBRARY_DIR}/package-lock.json ${FUNCTION_DIR}

ENV PLAYWRIGHT_BROWSERS_PATH=/pw-browsers
RUN mkdir /pw-browsers

# playwright をインストール
RUN npx -y playwright install --with-deps chromium

# ランタイムインターフェースクライアントをデフォルトコマンドとして設定
ENTRYPOINT ["/usr/local/bin/npx", "aws-lambda-ric"]

# ハンドラーの名前をランタイムに引数として渡す
CMD ["index.handler"]