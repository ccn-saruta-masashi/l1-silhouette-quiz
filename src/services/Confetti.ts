import confetti from 'canvas-confetti'

/**
 * 結果画面の花吹雪。canvas-confetti で、画面いっぱいの canvas に散らす。
 * 正解数が多いほど、量・時間・勢いを増やす（0 問は散らさない）
 */

/** 桜色を中心に、サイトの金色と白を混ぜる */
const COLORS = ['#f7b6c8', '#fbd3de', '#f28fab', '#ffffff', '#c8a65e', '#ead49b']

/** 花びらの形（しずく形）。円と混ぜて、花吹雪らしく見せる */
let petal: confetti.Shape | null = null
function shapes(): confetti.Shape[] {
  petal ??= confetti.shapeFromPath({
    path: 'M5 0 C9 4 10 9 5 14 C0 9 1 4 5 0 Z',
  })
  return [petal, petal, 'circle']
}

/** すべての花吹雪に共通の設定 */
function base(): confetti.Options {
  return {
    colors: COLORS,
    shapes: shapes(),
    // 視差効果を減らす設定では散らさない
    disableForReducedMotion: true,
    zIndex: 1000,
  }
}

/** 上から降らせ続けている間の requestAnimationFrame の番号 */
let frame: number | null = null
/** 少し遅らせて打ち上げる予定のタイマー */
const timers: number[] = []

/** 花吹雪を止めて、画面に残っているものも消す（結果画面を離れるとき） */
export function stopConfetti() {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
  for (const timer of timers.splice(0)) clearTimeout(timer)
  confetti.reset()
}

/** 左右の下から、斜め上へ打ち上げる */
function sideCannons(particleCount: number) {
  for (const [x, angle] of [
    [0, 60],
    [1, 120],
  ]) {
    void confetti({
      ...base(),
      particleCount,
      angle,
      spread: 65,
      startVelocity: 60,
      origin: { x, y: 0.9 },
      ticks: 300,
    })
  }
}

/**
 * 正解数に応じて花吹雪を散らす。
 * - 0 問: 散らさない
 * - 1 問: 上からちらちらと数枚降る
 * - 正解数が多いほど降る量と時間を増やし、7 問以上は左右から打ち上げる
 * - 10 問: 打ち上げを 2 回と、中央からの破裂を加えて盛大にする
 */
export function celebrate(correctCount: number, total: number) {
  stopConfetti()
  if (correctCount <= 0) return
  const ratio = Math.min(correctCount / total, 1)

  // 上から降らせる。1 フレームごとに、ratio に応じた確率と枚数で落とす
  const end = performance.now() + 900 + ratio * 2600
  const chance = 0.12 + ratio * 0.88
  const perFrame = Math.ceil(ratio * 3)
  const fall = () => {
    if (Math.random() < chance) {
      void confetti({
        ...base(),
        particleCount: perFrame,
        angle: 270,
        spread: 40,
        startVelocity: 2 + ratio * 6,
        origin: { x: Math.random(), y: -0.05 },
        gravity: 0.45 + ratio * 0.35,
        drift: Math.random() - 0.5,
        ticks: 420,
        scalar: 1.1,
      })
    }
    frame = performance.now() < end ? requestAnimationFrame(fall) : null
  }
  frame = requestAnimationFrame(fall)

  if (ratio >= 0.7) sideCannons(Math.round(140 * ratio))

  if (ratio >= 1) {
    // 中央から大きく破裂させ、少しして左右からもう一度打ち上げる
    timers.push(
      window.setTimeout(() => {
        void confetti({
          ...base(),
          particleCount: 180,
          spread: 360,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.35 },
          ticks: 320,
          scalar: 1.2,
        })
      }, 450),
      window.setTimeout(() => sideCannons(160), 1300),
    )
  }
}
