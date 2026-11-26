import type { LivlyInfo } from '../types/api'

/** 選択肢の数（正解 1 + 不正解） */
const CHOICE_COUNT = 3

/**
 * カラー違いの名前の末尾。「ピグミー P-1」「トビネ Pα-1」「マウンテンピグミーP-2」など。
 * シルエットにすると基本形と見分けがつかないため、出題・選択肢から除く。
 */
const VARIANT_SUFFIX = /\s*Pα?-\d+$/

export interface Question {
  answer: LivlyInfo
  /** answer を含む、表示順にシャッフル済みの選択肢 */
  choices: LivlyInfo[]
}

/**
 * 出題に使うリヴリーを絞り込む。カラー違いを除き、同じ名前は最初の 1 体にまとめる
 * （管理リヴリーが同名で入っている場合があるため）。
 */
export function toQuizCandidates(livlys: LivlyInfo[]): LivlyInfo[] {
  const seen = new Set<string>()
  return livlys.filter((livly) => {
    if (VARIANT_SUFFIX.test(livly.kind) || seen.has(livly.kind)) return false
    seen.add(livly.kind)
    return true
  })
}

/** Fisher–Yates で並びをランダムにした新しい配列を返す。 */
function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 候補からランダムに 1 体選ぶ（スタート画面の表示用）。 */
export function pickRandom(candidates: LivlyInfo[]): LivlyInfo {
  if (candidates.length === 0) {
    throw new Error('No livly to pick')
  }
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/**
 * 候補からランダムに 1 問作る。candidates は toQuizCandidates 済みで、
 * 名前が重複しない前提（不正解の選択肢が正解と同名にならないようにするため）。
 */
export function createQuestion(candidates: LivlyInfo[]): Question {
  if (candidates.length < CHOICE_COUNT) {
    throw new Error('Not enough livlys to create a question')
  }
  const choices = shuffle(candidates).slice(0, CHOICE_COUNT)
  const answer = choices[Math.floor(Math.random() * CHOICE_COUNT)]
  return { answer, choices }
}

/** 紹介モーダルのサムネイルに使うモーション（図鑑データの motions[].label） */
const PROFILE_MOTION_LABELS = new Set([
  '待機',
  '移動',
  '食べる',
  'トイレ',
  'シャワー',
  '眠る',
  'つままれる',
  '固有',
  'ペアポーズ',
])

/**
 * 紹介モーダルのサムネイルを、対象のモーションからランダムに 1 つ選ぶ。
 * 該当するモーションがなければ、通常の大きい画像を使う。
 */
export function pickProfileThumbnail(livly: LivlyInfo): string {
  const motions = (livly.motions ?? []).filter((motion) =>
    PROFILE_MOTION_LABELS.has(motion.label),
  )
  if (motions.length === 0) return livly.firstViewImgPath
  return motions[Math.floor(Math.random() * motions.length)].thumbnailPath
}
