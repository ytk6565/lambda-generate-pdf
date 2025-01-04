## 役割

- ローカルでPDFを生成する

## ブラウザをインストール

自動的に削除されるように `/tmp` 以下を指定していますが、任意のパスにダウンロードしていただいて大丈夫です。

```bash
npx @puppeteer/browsers install chromium@latest --path /tmp/localChromium
```

実装後にダウンロードされたブラウザのパスが出力されます。

```bash
chromium@1399006 /tmp/localChromium/chromium/mac_arm-1399006/chrome-mac/Chromium.app/Contents/MacOS/Chromium
```

## 環境変数の設定

環境変数のサンプルファイルをコピーします。

```bash
cp local/.example.aws.env local/.aws.env
cp local/.example.chromium.env local/.chromium.env
```

`local/.aws.env` の `AWS_ACCESS_KEY_ID` , `AWS_SECRET_ACCESS_KEY` をご自身の認証情報に置き換えてください。

`local/.chromium.env` の `PUPPETEER_EXECUTABLE_PATH` ダウンロードされたブラウザのパスに置き換えてください。

```.env
PUPPETEER_EXECUTABLE_PATH=/tmp/localChromium/chromium/mac_arm-1399006/chrome-mac/Chromium.app/Contents/MacOS/Chromium
```

## PDF生成処理の実行

```bash
npm run dev
```