import { type CSSProperties, useEffect, useState } from 'react'

/** タイトルを区切って、1 語ずつ登場させる */
const TITLE_WORDS = ['リヴリー', 'シルエット', 'クイズ']
/** 説明文。1 行ずつ並べ、タイプライター方式で 1 文字ずつ表示する */
const LEAD_LINES = ['めざせ研究員！', 'あなたは何体 当てられますか？']
/** 各行の先頭が、説明文全体の何文字目にあたるか */
const LINE_OFFSETS = LEAD_LINES.map((_, index) =>
  LEAD_LINES.slice(0, index).join('').length,
)
/** 説明文全体の文字数 */
const LEAD_LENGTH = LEAD_LINES.join('').length

/** 1 語ごとの登場の間隔（秒）。App.css の animation-delay の計算に使う */
const WORD_INTERVAL = 0.32
/** タイトルの演出（3 語の登場と「どーん！」）が終わって、説明文を打ち始めるまでの時間（ms） */
const TYPE_START = 1700
/** 説明文を 1 文字打つ間隔（ms） */
const TYPE_INTERVAL = 70

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * スタート画面のタイトル。3 語を 1 語ずつ大きな状態から叩きつけるように登場させ、
 * そろったら全体を「どーん！」と弾ませる（動きは App.css の .site-title.--intro）
 */
export function IntroTitle() {
  return (
    <h1 className="site-title --intro">
      <span className="visually-hidden">{TITLE_WORDS.join('')}</span>
      {TITLE_WORDS.map((word, index) => (
        <span
          key={word}
          className="site-title-word"
          aria-hidden="true"
          style={{ '--word-delay': `${index * WORD_INTERVAL}s` } as CSSProperties}
        >
          {word}
        </span>
      ))}
    </h1>
  )
}

/**
 * スタート画面の説明文を、タイトルの演出のあとにタイプライター方式で 1 文字ずつ表示する。
 * 文字はまだ見えないうちから場所を取っておき（visibility: hidden）、表示が進んでもレイアウトがずれない。
 * 読み上げには最初から全文（visually-hidden）を伝え、見た目の文字は読み上げから隠す
 */
export function TypewriterLead() {
  // 視差効果を減らす設定では、最初から全部表示する
  const [shown, setShown] = useState(() =>
    prefersReducedMotion() ? LEAD_LENGTH : 0,
  )

  useEffect(() => {
    if (shown >= LEAD_LENGTH) return
    const timer = window.setTimeout(
      () => setShown((count) => count + 1),
      shown === 0 ? TYPE_START : TYPE_INTERVAL,
    )
    return () => window.clearTimeout(timer)
  }, [shown])

  return (
    <p className="site-lead">
      <span className="visually-hidden">{LEAD_LINES.join(' ')}</span>
      {LEAD_LINES.map((line, lineIndex) => (
        <span key={line} className="site-lead-line" aria-hidden="true">
          {/* まだ 1 文字も打っていない間は、1 行目の先頭でカーソルを点滅させる */}
          {shown === 0 && lineIndex === 0 && (
            <span className="site-lead-caret --start" />
          )}
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
