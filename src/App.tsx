import { useEffect, useState } from 'react'
import { fetchData } from './services/PictureBookApi'
import type { LivlyInfo } from './types/api'
import { createQuestion, type Question, toQuizCandidates } from './utils/quiz'
import './App.css'

interface QuizState {
  candidates: LivlyInfo[]
  question: Question
}

function App() {
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchData()
      .then((data) => {
        const candidates = toQuizCandidates(data.mono)
        setQuiz({ candidates, question: createQuestion(candidates) })
      })
      .catch(setError)
  }, [])

  if (error) {
    return <p className="status">データの取得に失敗しました: {error.message}</p>
  }
  if (!quiz) {
    return <p className="status">読み込み中…</p>
  }

  const { candidates, question } = quiz

  const answer = (choice: LivlyInfo) => {
    alert(
      choice.id === question.answer.id
        ? '正解！'
        : `不正解… 正解は「${question.answer.kind}」`,
    )
    setQuiz({ candidates, question: createQuestion(candidates) })
  }

  return (
    <main className="quiz">
      <div className="silhouette-frame">
        {/* key で問題ごとに作り直し、新しい画像の読み込み中に前の問題の画像が残らないようにする */}
        <img
          key={question.answer.id}
          className="silhouette"
          src={question.answer.firstViewImgPath}
          alt="このリヴリーはだれ？"
          draggable={false}
        />
      </div>

      <ul className="choices">
        {question.choices.map((choice) => (
          <li key={choice.id}>
            <button
              type="button"
              className="choice"
              onClick={() => answer(choice)}
            >
              {choice.kind}
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
