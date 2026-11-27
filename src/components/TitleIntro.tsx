import { type CSSProperties, useEffect, useState } from 'react'
import logoUrl from '../assets/title/logo.svg'
import quizUrl from '../assets/title/quiz.svg'
import silhouetteUrl from '../assets/title/silhouette.svg'

/** タイトルの読み上げ用の文言（見た目はロゴ画像） */
const TITLE_TEXT = 'リヴリーシルエットクイズ'
/**
 * タイトルの登場の演出（画像を叩きつけて「どーん！」）をするか。ロゴ画像に差し替えたので一旦止めている。
 * true に戻すと、スタート画面（intro）で演出する
 */
const TITLE_ANIMATION = false
/** 説明文。1 行ずつ並べ、タイプライター方式で 1 文字ずつ表示する */
const LEAD_LINES = ['めざせ研究員！', 'あなたは何体 当てられますか？']
/** 各行の先頭が、説明文全体の何文字目にあたるか */
const LINE_OFFSETS = LEAD_LINES.map((_, index) =>
  LEAD_LINES.slice(0, index).join('').length,
)
/** 説明文全体の文字数 */
const LEAD_LENGTH = LEAD_LINES.join('').length

/** タイトルの画像を 1 つずつ登場させる間隔（秒）。App.css の animation-delay の計算に使う */
const WORD_INTERVAL = 0.32
/**
 * 説明文を打ち始めるまでの時間（ms）。タイトルの演出（画像の登場と「どーん！」）があるときは
 * それが終わるのを待つ。演出を止めている間は、待たずにいきなり打ち始める
 */
const TYPE_START = TITLE_ANIMATION ? 1700 : 0
/** 説明文を打ち終えてから、onDone で知らせる（リヴリーと吹き出しを表示する）までの間（ms） */
const DONE_DELAY = 500
/** 説明文を 1 文字打つ間隔（ms） */
const TYPE_INTERVAL = 70

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** 登場の順番（ロゴ → シルエット → クイズ）に応じた animation-delay */
function partDelay(order: number): CSSProperties {
  return { '--word-delay': `${order * WORD_INTERVAL}s` } as CSSProperties
}

/**
 * ヘッダーのタイトル。1 段目に「NEW EDITION Livly Island」のロゴ、2 段目に「シルエット」「クイズ」を
 * 高さをそろえて並べる（どれも SVG 画像）。読み上げでは「リヴリーシルエットクイズ」と伝える。
 * intro を付けると（TITLE_ANIMATION が true のとき）、3 つの画像を 1 つずつ大きな状態から
 * 叩きつけるように登場させ、そろったら全体を「どーん！」と弾ませる（動きは App.css の .site-title.--intro）
 */
export function SiteTitle({ intro = false }: { intro?: boolean }) {
  return (
    <h1 className={`site-title ${intro && TITLE_ANIMATION ? '--intro' : ''}`}>
      <span className="visually-hidden">{TITLE_TEXT}</span>
      <img
        className="site-title-part site-title-logo"
        src={logoUrl}
        alt=""
        draggable={false}
        style={partDelay(0)}
      />
      <span className="site-title-row">
        <img
          className="site-title-part site-title-silhouette"
          src={silhouetteUrl}
          alt=""
          draggable={false}
          style={partDelay(1)}
        />
        <img
          className="site-title-part site-title-quiz"
          src={quizUrl}
          alt=""
          draggable={false}
          style={partDelay(2)}
        />
      </span>
    </h1>
  )
}

/**
 * スタート画面の説明文を、タイトルの演出のあとにタイプライター方式で 1 文字ずつ表示する。
 * 文字はまだ見えないうちから場所を取っておき（visibility: hidden）、表示が進んでもレイアウトがずれない。
 * 読み上げには最初から全文（visually-hidden）を伝え、見た目の文字は読み上げから隠す。
 * 打ち終わったら 0.5 秒おいて onDone を呼ぶ（視差効果を減らす設定では、すぐ呼ぶ）
 */
export function TypewriterLead({ onDone }: { onDone?: () => void }) {
  // 視差効果を減らす設定では、最初から全部表示する
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() ? LEAD_LENGTH : 0,
  )

  useEffect(() => {
    if (shown >= LEAD_LENGTH) {
      // 打ち終わったら、ひと呼吸おいて知らせる（スタート画面のリヴリーと吹き出しを表示する合図）。
      // 視差効果を減らす設定では、待たずにすぐ知らせる
      if (prefersReducedMotion()) {
        onDone?.()
        return
      }
      const timer = window.setTimeout(() => onDone?.(), DONE_DELAY)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(
      () => setShown((count) => count + 1),
      shown === 0 ? TYPE_START : TYPE_INTERVAL,
    )
    return () => window.clearTimeout(timer)
  }, [shown, onDone])

  return (
    <p className="site-lead">
      <span className="visually-hidden">{LEAD_LINES.join(' ')}</span>
      {LEAD_LINES.map((line, lineIndex) => (
        <span key={line} className="site-lead-line" aria-hidden="true">
          {[...line].map((char, charIndex) => {
            const position = LINE_OFFSETS[lineIndex] + charIndex
            return (
              <span
                key={position}
                className={`site-lead-char ${position < shown ? '' : '--hidden'}`}
              >
                {char}
                {/* 打っている位置（最後に表示した文字の後ろ）にカーソルを点滅させる */}
                {position === shown - 1 && <span className="site-lead-caret" />}
              </span>
            )
          })}
        </span>
      ))}
    </p>
  )
}
