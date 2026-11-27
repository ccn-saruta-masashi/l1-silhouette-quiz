/**
 * 「閉じる」を表す ✕ アイコン。NextIcon（「>」）と同じく、端と角を丸めた線で描く。
 * 色は currentColor（ボタンの文字色）を使う
 */
export function CloseIcon() {
  return (
    <svg className="close-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M 6.5 6.5 L 17.5 17.5 M 17.5 6.5 L 6.5 17.5" />
    </svg>
  )
}
