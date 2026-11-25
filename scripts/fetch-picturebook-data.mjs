/**
 * dev / build の開始時に図鑑データ JSON を取得し、public 配下へスナップショットとして保存する。
 *
 * 取得元は CORS ヘッダーを返さないため、ブラウザから直接 fetch できない。
 * ここで取得したファイルをアプリと同一オリジンの静的ファイルとして配信する。
 *
 * 取得元は本番 (www.livly.com)。JSON 内の画像 URL も取得元のドメインになり、staging は
 * Basic 認証が必要で配置先から表示できないため。staging のデータを
 * 使うときは API_BASE_URL=https://www-staging.livly.com を指定する。
 *
 * 構造の検証はここでは行わない。src/services/PictureBookApi.ts の
 * assertPictureBookData を唯一の検証箇所として維持する。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const API_BASE_URL = process.env.API_BASE_URL || 'https://www.livly.com'
const DATA_PATH = '/data/picturebook/livly_picture_book.json'
const OUTPUT_PATH = join(process.cwd(), 'public', DATA_PATH)

async function main() {
  const url = new URL(DATA_PATH, API_BASE_URL)
  // CDN のキャッシュを避けるため毎回クエリを変える
  url.search = String(Date.now())

  console.log(`[picturebook] fetching ${url.origin}${url.pathname}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch picture book data: HTTP ${response.status} ${response.statusText}`,
    )
  }

  const text = await response.text()
  // JSON として壊れていないことだけ確認する（構造の検証は利用側で行う）
  JSON.parse(text)

  await mkdir(dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, text)

  const sizeMb = (Buffer.byteLength(text) / 1024 / 1024).toFixed(1)
  console.log(`[picturebook] saved ${OUTPUT_PATH} (${sizeMb}MB)`)
}

main().catch((error) => {
  console.error(`[picturebook] ${error.message}`)
  process.exit(1)
})
