import {
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
  useEffect,
  useState,
} from 'react'
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

/** リヴリーの吹き出し。タップでそのリヴリーの紹介モーダルを開く */
function ProfileBubble({
  livly,
  onOpen,
  children,
}: {
  livly: LivlyInfo
  onOpen: (livly: LivlyInfo) => void
  children: ReactNode
}) {
  return (
    <SpeechBubble
      label={`${livly.kind}の紹介を見る`}
      onClick={() => onOpen(livly)}
    >
      {children}
    </SpeechBubble>
  )
}

interface QuizState {
  candidates: LivlyInfo[]
  /** スタート画面にカラーで表示するリヴリー */
  featured: LivlyInfo
  /** 「クイズをはじめる」を押したか。false の間はスタート画面を出す */
  started: boolean
  question: Question
  /** 何問目か。問題ごとにリヴリーの枠を作り直す key に使う（同じリヴリーが続けて出ても登場アニメーションを再生するため） */
  round: number
  /** 押した選択肢。押してから次の問題に進むまでの間、リヴリーをカラーで表示する */
  selected: LivlyInfo | null
  /** 正誤のマークを見せ終えて、結果画面（吹き出しと「つぎの問題にすすむ」）を出しているか */
  showResult: boolean
}

/** 選択肢を押してから結果画面に切り替えるまで、正誤のマークを見せる時間（ms） */
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
          round: 1,
          selected: null,
          showResult: false,
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

  const { featured, started, question, round, selected, showResult } = quiz

  /** 紹介モーダルを開く。サムネイルは開くたびにランダムで選び直す */
  const openProfile = (livly: LivlyInfo) =>
    setProfile({ livly, thumbnail: pickProfileThumbnail(livly) })

  const profileModal = (
    <LivlyProfileModal
      livly={profile?.livly ?? null}
      thumbnail={profile?.thumbnail ?? ''}
      onClose={() => setProfile(null)}
    />
  )

  if (!started) {
    return (
      <Layout>
        <main className="quiz">
          {/* スタート画面は登場アニメーションなしでそのまま表示する（--drop-in を付けない）。
              key はクイズ側と別にし、最初の問題が同じリヴリーでも枠を作り直してアニメーションを再生させる */}
          <div className="livly-stage">
            <ProfileBubble livly={featured} onOpen={openProfile}>
              わたしは
              <br />
              どんなリヴリー？
            </ProfileBubble>
            <div key={`start-${featured.id}`} className="livly-frame">
              {/* 吹き出しと同じく、リヴリーのタップでも紹介モーダルを開く。
                  キーボード・読み上げでは吹き出しのボタンから開けるので、ここはボタンにしない */}
              <img
                className="livly-figure --tappable"
                src={featured.firstViewImgPath}
                alt={featured.kind}
                draggable={false}
                onClick={() => openProfile(featured)}
              />
            </div>
          </div>

          <div className="single-action">
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
        {profileModal}
      </Layout>
    )
  }

  /**
   * 押したらシルエットを外してカラーで見せ、選択肢のボタン上に正誤のマークを出す。
   * 少し見せてから結果画面（吹き出しと「つぎの問題にすすむ」）に切り替える
   */
  const answer = (choice: LivlyInfo) => {
    if (selected) return
    setQuiz({ ...quiz, selected: choice })
    setTimeout(() => {
      setQuiz((current) => current && { ...current, showResult: true })
    }, REVEAL_DURATION)
  }

  const goNext = () =>
    setQuiz({
      ...quiz,
      question: createQuestion(quiz.candidates),
      round: round + 1,
      selected: null,
      showResult: false,
    })

  return (
    <Layout>
      <main className="quiz">
        {/* 結果画面に切り替えても枠（と画像）を作り直さないよう、吹き出しの有無に関わらず
            同じ .livly-stage の中に置く。作り直すと登場アニメーションがもう一度再生されてしまう */}
        <div className="livly-stage">
          {showResult && (
            <ProfileBubble livly={question.answer} onOpen={openProfile}>
              正解は
              <br />
              {/* 長い名前でも 1 行に収まるよう、名前だけ文字を縮められるようにする */}
              <span
                className="speech-bubble-name"
                style={
                  {
                    '--name-length': question.answer.kind.length,
                  } as CSSProperties
                }
              >
                {question.answer.kind}
              </span>
              <br />
              でした。
            </ProfileBubble>
          )}
          {/* key で問題ごとに枠を作り直す。新しい画像の読み込み中に前の問題の画像が残らず、
              data-shown も消えて登場アニメーションが毎問最初から再生される */}
          <div key={`question-${round}`} className="livly-frame --drop-in">
            {/* 結果画面では、吹き出しと同じくリヴリーのタップでも紹介モーダルを開く。
                画像を作り直さないよう、要素は変えずにクラスと onClick だけ切り替える */}
            <img
              className={`livly-figure ${selected ? '' : '--silhouette'} ${showResult ? '--tappable' : ''}`}
              src={question.answer.firstViewImgPath}
              alt={selected ? question.answer.kind : 'このリヴリーはだれ？'}
              draggable={false}
              onLoad={dropIn}
              onClick={
                showResult ? () => openProfile(question.answer) : undefined
              }
            />
          </div>
        </div>

        {showResult ? (
          <div className="single-action">
            <button type="button" className="pill-button" onClick={goNext}>
              つぎの問題にすすむ
              <NextIcon />
            </button>
          </div>
        ) : (
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
        )}

        {/* マークは見た目で伝わるが、読み上げでも結果がわかるように知らせる */}
        <p className="visually-hidden" aria-live="polite">
          {selected &&
            (selected.id === question.answer.id
              ? '正解！'
              : `不正解… 正解は「${question.answer.kind}」`)}
        </p>
      </main>
      {profileModal}
    </Layout>
  )
}

export default App
