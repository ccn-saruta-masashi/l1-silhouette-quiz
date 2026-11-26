import type { ReactNode } from 'react'

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
 * リヴリーの問いかけを出す吹き出し。突端（下側）を中心にゆっくり左右に揺れる。
 * 形は SVG で描き、文字は HTML で重ねる（Web フォントと改行をそのまま使うため）
 */
export function SpeechBubble({ children, onClick, label }: SpeechBubbleProps) {
  const body = (
    <>
      <svg
        className="speech-bubble-shape"
        viewBox="0 0 320 224"
        aria-hidden="true"
      >
        {/* 楕円の本体と、左下へ伸びる突端を 1 本の線で描く */}
        <path d="M 212 165 A 148 80 0 1 0 178 169.4 L 166 218 Z" />
        {/* 右上の「?」バッジ */}
        <circle className="speech-bubble-badge" cx="284" cy="38" r="30" />
        <text className="speech-bubble-badge-text" x="284" y="38">
          ?
        </text>
      </svg>
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
