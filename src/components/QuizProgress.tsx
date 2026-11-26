interface QuizProgressProps {
  /** 問題数 */
  total: number
  /** 今の問題の番号（1 始まり）。終了後など、今の問題がないときは null */
  current: number | null
  /** 答えた問題の正誤。前から順に、正解なら true */
  results: readonly boolean[]
}

type DotState = 'correct' | 'incorrect' | 'upcoming'

/**
 * クイズの進み具合。「Q.3 / 10」と正解数のバッジ、問題ごとのドットを並べる。
 * ドットは答えた問題を正解なら緑・不正解なら赤で塗り、今の問題を金の輪で示す。
 * 見た目は読み上げから隠し、まとめた一文を別に読ませる
 */
export function QuizProgress({ total, current, results }: QuizProgressProps) {
  const correctCount = results.filter(Boolean).length

  return (
    <section className="quiz-progress">
      <p className="visually-hidden">
        {current !== null
          ? `${total}問中${current}問目、正解${correctCount}問`
          : `${total}問中${correctCount}問正解`}
      </p>

      <div className="quiz-progress-head" aria-hidden="true">
        {current !== null && (
          <p className="quiz-progress-count">
            <span className="quiz-progress-q">Q.</span>
            <span className="quiz-progress-current">{current}</span>
            <span className="quiz-progress-total">/ {total}</span>
          </p>
        )}
        {/* 正解数が変わるたびに作り直して、拡大から戻るアニメーションを再生する。0 のときは動かさない */}
        <p
          key={correctCount}
          className={`quiz-progress-score ${correctCount > 0 ? '--bump' : ''}`}
        >
          <svg className="quiz-progress-score-mark" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6.5" />
          </svg>
          正解
          <span className="quiz-progress-score-value">{correctCount}</span>
        </p>
      </div>

      <ol className="quiz-progress-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => {
          const result = results[index]
          const state: DotState =
            result === undefined ? 'upcoming' : result ? 'correct' : 'incorrect'
          const isCurrent = current === index + 1
          return (
            <li
              key={index}
              className={`quiz-progress-dot --${state} ${isCurrent ? '--current' : ''}`}
            />
          )
        })}
      </ol>
    </section>
  )
}
