/** 結果画面の称号とひとことコメント */
export interface Rank {
  title: string
  comment: string
}

/** 正解数（0〜10 問）ごとの称号とコメント。添字が正解数 */
const RANKS: readonly Rank[] = [
  { title: '通行人', comment: 'たまたま通りかかっただけのようです。' },
  { title: 'うっかり迷い込んだ人', comment: '気づけば研究所の中にいました。' },
  { title: '見学ツアー参加者', comment: '名札を首から下げています。' },
  {
    title: '差し入れを持ってくる人',
    comment: '用はないけど、なぜかまた来ています。',
  },
  { title: '受付と顔なじみの人', comment: 'もう名札なしで入れます。' },
  { title: '白衣を試着した人', comment: 'まだ袖が少し長いようです。' },
  { title: '研究員見習い（自称）', comment: '名刺は手書きです。' },
  { title: '助手の助手', comment: 'コーヒーを淹れるのが上手です。' },
  { title: '試験管を割らない人', comment: '研究所内で信頼され始めています。' },
  { title: 'ほぼ研究員', comment: 'あと一歩。白衣はもう似合っています。' },
  { title: '立派な研究員', comment: 'あなたは文句なしの研究員です！' },
]

/** 正解数に応じた称号とコメントを返す。範囲外の数は 0〜10 に収める */
export function rankFor(correctCount: number): Rank {
  const index = Math.min(Math.max(correctCount, 0), RANKS.length - 1)
  return RANKS[index]
}
