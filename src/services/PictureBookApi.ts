import type { PictureBookData } from '../types/api'

/** scripts/fetch-picturebook-data.mjs が public 配下に書き出すスナップショット */
const DATA_URL = `${import.meta.env.BASE_URL}data/picturebook/livly_picture_book.json`

/**
 * 取得した JSON が PictureBookData の必須構造を満たすか検証する。
 * APIスキーマ変更や破損レスポンス時に、利用側でのクラッシュ前に早期に弾く。
 */
function assertPictureBookData(data: unknown): asserts data is PictureBookData {
  const d = data as Record<string, unknown>
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(d.mono) ||
    !Array.isArray(d.classic) ||
    typeof d.updateInfo !== 'object' ||
    d.updateInfo === null ||
    typeof d.keywordIdToTextMap !== 'object' ||
    d.keywordIdToTextMap === null
  ) {
    throw new Error('Invalid picture book data structure')
  }
}

/**
 * 図鑑データを取得し、構造を検証して返す。
 */
export async function fetchData(): Promise<PictureBookData> {
  const response = await fetch(DATA_URL)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

  const data: unknown = await response.json()
  assertPictureBookData(data)
  return data
}
