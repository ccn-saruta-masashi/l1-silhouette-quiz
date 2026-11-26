import { type ReactNode, type SyntheticEvent, useEffect, useState } from 'react'
import { fetchData } from './services/PictureBookApi'
import type { LivlyInfo } from './types/api'
import {
  createQuestion,
  pickRandom,
  type Question,
  toQuizCandidates,
} from './utils/quiz'
import './App.css'

/**
 * 画像の読み込みが終わったら、枠 (.livly-frame) に data-shown を付けて CSS の落下
 * アニメーションを始める（livly-ratio の dropInOnReveal をクイズ用にしたもの）。
 * クイズの画像は 1 体で最初から画面内にあるので、画面に入ったときではなく読み込み完了で始める。
 * 読み込み前に始めると、落ちてくる途中が空のまま終わってしまうため
 */
function dropIn(event: SyntheticEvent<HTMLImageElement>) {
  const frame = event.currentTarget.parentElement
  if (!frame) return
  // 足元から画面の上端までの距離。落下の開始位置をここより上にして、開始位置が見えないようにする
  frame.style.setProperty('--drop-distance', `${frame.getBoundingClientRect().bottom}px`)
  frame.dataset.shown = ''
}

/** タイトルと説明文のヘッダーを付けた画面の枠。読み込み中・エラー時も同じヘッダーを出す */
function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <header className="site-header">
        <h1 className="site-title">リヴリーシルエットクイズ</h1>
        <p className="site-lead">あなたは何体 当てられるかな？</p>
      </header>
      {children}
    </div>
  )
}

interface QuizState {
  candidates: LivlyInfo[]
  /** スタート画面にカラーで表示するリヴリー */
  featured: LivlyInfo
  /** 「クイズをはじめる」を押したか。false の間はスタート画面を出す */
  started: boolean
  question: Question
}

function App() {
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchData()
      .then((data) => {
        const candidates = toQuizCandidates(data.mono)
        setQuiz({
          candidates,
          featured: pickRandom(candidates),
          started: false,
          question: createQuestion(candidates),
        })
      })
      .catch(setError)
  }, [])

  if (error) {
    return (
      <Layout>
        <p className="status">データの取得に失敗しました: {error.message}</p>
      </Layout>
    )
  }
  if (!quiz) {
    return (
      <Layout>
        <p className="status">読み込み中…</p>
      </Layout>
    )
  }

  const { candidates, featured, started, question } = quiz

  if (!started) {
    return (
      <Layout>
        <main className="quiz">
          {/* スタート画面は登場アニメーションなしでそのまま表示する（--drop-in を付けない）。
              key はクイズ側と別にし、最初の問題が同じリヴリーでも枠を作り直してアニメーションを再生させる */}
          <div key={`start-${featured.id}`} className="livly-frame">
            <img
              className="livly-figure"
              src={featured.firstViewImgPath}
              alt={featured.kind}
              draggable={false}
            />
          </div>

          <div className="start-action">
            <button
              type="button"
              className="pill-button"
              onClick={() => setQuiz({ ...quiz, started: true })}
            >
              クイズをはじめる
            </button>
          </div>
        </main>
      </Layout>
    )
  }

  const answer = (choice: LivlyInfo) => {
    alert(
      choice.id === question.answer.id
        ? '正解！'
        : `不正解… 正解は「${question.answer.kind}」`,
    )
    setQuiz({ ...quiz, question: createQuestion(candidates) })
  }

  return (
    <Layout>
      <main className="quiz">
        {/* key で問題ごとに枠を作り直す。新しい画像の読み込み中に前の問題の画像が残らず、
            data-shown も消えて登場アニメーションが毎問最初から再生される */}
        <div
          key={`question-${question.answer.id}`}
          className="livly-frame --drop-in"
        >
          <img
            className="livly-figure --silhouette"
            src={question.answer.firstViewImgPath}
            alt="このリヴリーはだれ？"
            draggable={false}
            onLoad={dropIn}
          />
        </div>

        <ul className="choices">
          {question.choices.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                className="pill-button"
                onClick={() => answer(choice)}
              >
                {choice.kind}
              </button>
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  )
}

export default App
