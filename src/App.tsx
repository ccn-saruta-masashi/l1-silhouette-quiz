import { type ReactNode, type SyntheticEvent, useEffect, useState } from 'react'
import { AnswerMark } from './components/AnswerMark'
import { LivlyProfileModal } from './components/LivlyProfileModal'
import { NextIcon } from './components/NextIcon'
import { SpeechBubble } from './components/SpeechBubble'
import { fetchData } from './services/PictureBookApi'
import type { LivlyInfo } from './types/api'
import {
  createQuestion,
  pickProfileThumbnail,
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
  /** 押した選択肢。押してから次の問題に進むまでの間、リヴリーをカラーで表示する */
  selected: LivlyInfo | null
}

/** 選択肢を押してから次の問題に進むまで、カラーの姿と正誤のマークを見せる時間（ms） */
const REVEAL_DURATION = 2000

function App() {
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [error, setError] = useState<Error | null>(null)
  /** 紹介モーダルに出しているリヴリーとサムネイル。null の間は閉じている */
  const [profile, setProfile] = useState<{
    livly: LivlyInfo
    thumbnail: string
  } | null>(null)

  useEffect(() => {
    fetchData()
      .then((data) => {
        const candidates = toQuizCandidates(data.mono)
        setQuiz({
          candidates,
          featured: pickRandom(candidates),
          started: false,
          question: createQuestion(candidates),
          selected: null,
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

  const { featured, started, question, selected } = quiz

  if (!started) {
    return (
      <Layout>
        <main className="quiz">
          {/* スタート画面は登場アニメーションなしでそのまま表示する（--drop-in を付けない）。
              key はクイズ側と別にし、最初の問題が同じリヴリーでも枠を作り直してアニメーションを再生させる */}
          <div className="start-stage">
            {/* タップで紹介モーダルを開く。サムネイルは開くたびにランダムで選び直す */}
            <SpeechBubble
              label={`${featured.kind}の紹介を見る`}
              onClick={() =>
                setProfile({
                  livly: featured,
                  thumbnail: pickProfileThumbnail(featured),
                })
              }
            >
              わたしは
              <br />
              どんなリヴリー？
            </SpeechBubble>
            <div key={`start-${featured.id}`} className="livly-frame">
              <img
                className="livly-figure"
                src={featured.firstViewImgPath}
                alt={featured.kind}
                draggable={false}
              />
            </div>
          </div>

          <div className="start-action">
            <button
              type="button"
              className="pill-button"
              onClick={() => setQuiz({ ...quiz, started: true })}
            >
              クイズをはじめる
              <NextIcon />
            </button>
          </div>
        </main>
        <LivlyProfileModal
          livly={profile?.livly ?? null}
          thumbnail={profile?.thumbnail ?? ''}
          onClose={() => setProfile(null)}
        />
      </Layout>
    )
  }

  /**
   * 押したらシルエットを外してカラーで見せ、選択肢のボタン上に正誤のマークを出す。
   * 少し見せてから次の問題に進む
   */
  const answer = (choice: LivlyInfo) => {
    if (selected) return
    setQuiz({ ...quiz, selected: choice })
    setTimeout(() => {
      setQuiz((current) =>
        current
          ? {
              ...current,
              question: createQuestion(current.candidates),
              selected: null,
            }
          : current,
      )
    }, REVEAL_DURATION)
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
            className={`livly-figure ${selected ? '' : '--silhouette'}`}
            src={question.answer.firstViewImgPath}
            alt={selected ? question.answer.kind : 'このリヴリーはだれ？'}
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
                disabled={selected !== null}
                onClick={() => answer(choice)}
              >
                {selected && (
                  <AnswerMark correct={choice.id === question.answer.id} />
                )}
                {choice.kind}
              </button>
            </li>
          ))}
        </ul>

        {/* マークは見た目で伝わるが、読み上げでも結果がわかるように知らせる */}
        <p className="visually-hidden" aria-live="polite">
          {selected &&
            (selected.id === question.answer.id
              ? '正解！'
              : `不正解… 正解は「${question.answer.kind}」`)}
        </p>
      </main>
    </Layout>
  )
}

export default App
