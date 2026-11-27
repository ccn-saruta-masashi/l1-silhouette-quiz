import type { ReactNode } from 'react'
import bubbleUrl from '../assets/fukidashi.svg'
import questionUrl from '../assets/question.svg'

interface SpeechBubbleProps {
  children: ReactNode
  /**
   * タップしたときの処理（モーダルを開く予定）。渡したときだけボタンとして操作できる
   */
  onClick?: () => void
  /** onClick があるときの、読み上げ用のボタン名 */
  label?: string
}

/**
 * リヴリーの問いかけを出す吹き出し。しっぽの先を支点にゆっくり左右に揺れる。
 * 形は素材の SVG（assets/fukidashi.svg）を画像で敷き、右上に「?」のバッジ（assets/question.svg）を置く。
 * 文字は HTML で重ねる
 * （Web フォントと改行をそのまま使うため）
 */
export function SpeechBubble({ children, onClick, label }: SpeechBubbleProps) {
  const body = (
    <>
      <img
        className="speech-bubble-shape"
        src={bubbleUrl}
        alt=""
        draggable={false}
      />
      {/* 右上の「?」のバッジ（assets/question.svg） */}
      <img
        className="speech-bubble-badge"
        src={questionUrl}
        alt=""
        draggable={false}
      />
      <span className="speech-bubble-text">{children}</span>
    </>
  )

  return onClick ? (
    <button
      type="button"
      className="speech-bubble"
      onClick={onClick}
      aria-label={label}
    >
      {body}
    </button>
  ) : (
    <div className="speech-bubble">{body}</div>
  )
}
