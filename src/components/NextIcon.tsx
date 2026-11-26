/**
 * 「次へ進む」操作を表す、白い丸に「>」のアイコン。開始ボタンなど、ほかのボタンと
 * 見分けたい操作に付ける。.pill-button の中に置くと右端に配置される
 */
export function NextIcon() {
  return (
    <svg className="next-icon" viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="16" />
      <path d="M 13.5 9.5 L 20 16 L 13.5 22.5" />
    </svg>
  )
}
