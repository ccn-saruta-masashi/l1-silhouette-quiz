import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // サイトは /livly/silhouette-quiz/ 配下で配信する。ビルドした JS・CSS・画像の参照先と、
  // import.meta.env.BASE_URL（図鑑データの読み込み先）がこのパスから始まる
  base: '/livly/silhouette-quiz/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
