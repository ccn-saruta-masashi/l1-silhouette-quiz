interface AnswerMarkProps {
  /** true なら正解の「○」、false なら不正解の「×」 */
  correct: boolean
}

/**
 * 選択肢の正誤を表すマーク（正解は緑の「○」、不正解は赤の「×」）。
 * .pill-button の中に置くと左端に配置される
 */
export function AnswerMark({ correct }: AnswerMarkProps) {
  return (
    <svg
      className={`answer-mark ${correct ? '--correct' : '--incorrect'}`}
      viewBox="0 0 40 40"
      role="img"
      aria-label={correct ? '正解' : '不正解'}
    >
      {correct ? (
        <circle cx="20" cy="20" r="16.5" />
      ) : (
        <path d="M 7 7 L 33 33 M 33 7 L 7 33" />
      )}
    </svg>
  )
}
