// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: false },
  srcDir: "src/",
  nitro: {
    preset: "node",
  },
  app: {
    cdnURL: process.env.CDN_URL || "",
  }
})
