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
import { QuizProgress } from './components/QuizProgress'
import { SpeechBubble } from './components/SpeechBubble'
import { celebrate, stopConfetti } from './services/Confetti'
import { fetchData } from './services/PictureBookApi'
import { playRankSound } from './services/RankSounds'
import {
  playCorrectSound,
  playIncorrectSound,
  playTapSound,
} from './services/SoundEffects'
import type { LivlyInfo } from './types/api'
import {
  createQuestion,
  pickProfileThumbnail,
  pickRandom,
  QUESTION_COUNT,
  type Question,
  reshuffleChoices,
  toQuizCandidates,
} from './utils/quiz'
import { rankFor } from './utils/rank'
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

/**
 * タイトルと説明文のヘッダーを付けた画面の枠。読み込み中・エラー時も同じヘッダーを出す。
 * header を渡すと、タイトルと説明文の代わりにそれを出す（クイズ中の進み具合など）。
 * そのときもタイトルは読み上げ用に残す
 */
function Layout({
  children,
  header,
  shake = false,
  showLead = true,
}: {
  children: ReactNode
  header?: ReactNode
  /** true にすると画面を揺らす（不正解のとき） */
  shake?: boolean
  /** false にすると説明文（「あなたは何体 当てられるかな？」）を出さない（結果画面） */
  showLead?: boolean
}) {
  return (
    <div className={`page ${shake ? '--shake' : ''}`}>
      <header className="site-header">
        {header ? (
          <>
            <h1 className="visually-hidden">リヴリーシルエットクイズ</h1>
            {header}
          </>
        ) : (
          <>
            <h1 className="site-title">リヴリーシルエットクイズ</h1>
            {showLead && (
              <p className="site-lead">あなたは何体 当てられるかな？</p>
            )}
          </>
        )}
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
  /**
   * 今の場面。quiz は 10 問の本番、review は不正解だった問題の見直し、
   * finished は結果画面
   */
  phase: 'quiz' | 'review' | 'finished'
  question: Question
  /** 今の場面で何問目か（1 始まり）。問題ごとにリヴリーの枠を作り直す key にも使う */
  round: number
  /** 本番で出した問題と正誤。前から順に並ぶ。見直しで正解した問題は正解に数え直す */
  history: { question: Question; correct: boolean }[]
  /** 見直しの記録。targets は見直す問題の history の添字、results はその正誤 */
  review: { targets: number[]; results: boolean[] } | null
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
          phase: 'quiz',
          round: 1,
          history: [],
          review: null,
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

  const {
    featured,
    started,
    phase,
    question,
    round,
    history,
    review,
    selected,
    showResult,
  } = quiz
  const results = history.map(({ correct }) => correct)
  /** 見直していない（まだ不正解のままの）問題の history の添字 */
  const incorrectIndices = history.flatMap(({ correct }, index) =>
    correct ? [] : [index],
  )

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
              onClick={() => {
                playTapSound()
                setQuiz({ ...quiz, started: true })
              }}
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
    // 選択肢ではボタンの音は鳴らさず、正解・不正解の音だけにする（重なってうるさくならないように）
    if (choice.id === question.answer.id) playCorrectSound()
    else playIncorrectSound()
    const correct = choice.id === question.answer.id
    setQuiz({
      ...quiz,
      selected: choice,
      ...(review
        ? { review: { ...review, results: [...review.results, correct] } }
        : { history: [...history, { question, correct }] }),
    })
    setTimeout(() => {
      setQuiz((current) => current && { ...current, showResult: true })
    }, REVEAL_DURATION)
  }

  /** 今の場面の問題数（本番は 10 問、見直しは不正解だった問題の数） */
  const roundCount = review ? review.targets.length : QUESTION_COUNT
  const isLastRound = round >= roundCount

  /** 問題を始めるときの共通の状態（選択も結果画面もなし） */
  const freshRound = { selected: null, showResult: false }

  /**
   * 次の問題へ進む。本番では出題済みのリヴリーを正解にしない。
   * 最後の問題のあとは結果画面へ。見直しのあとは、見直しで正解した問題を正解に数え直す
   */
  const goNext = () => {
    playTapSound()
    if (isLastRound) {
      const updatedHistory = review
        ? history.map((entry, index) => {
            const at = review.targets.indexOf(index)
            return at !== -1 && review.results[at]
              ? { ...entry, correct: true }
              : entry
          })
        : history
      // 結果画面の表示に合わせて、（見直し後は数え直した）正解数に応じた効果音を鳴らし、花吹雪を散らす
      const correctCount = updatedHistory.filter(
        ({ correct }) => correct,
      ).length
      playRankSound(correctCount)
      celebrate(correctCount, QUESTION_COUNT)
      setQuiz({
        ...quiz,
        ...freshRound,
        phase: 'finished',
        history: updatedHistory,
        review: null,
      })
      return
    }
    setQuiz({
      ...quiz,
      ...freshRound,
      question: review
        ? reshuffleChoices(history[review.targets[round]].question)
        : createQuestion(
            quiz.candidates,
            new Set(history.map((entry) => entry.question.answer.id)),
          ),
      round: round + 1,
    })
  }

  /** 1 問目・正解 0 からやり直す */
  const restart = () => {
    playTapSound()
    stopConfetti()
    setQuiz({
      ...quiz,
      ...freshRound,
      phase: 'quiz',
      question: createQuestion(quiz.candidates),
      round: 1,
      history: [],
      review: null,
    })
  }

  /** 不正解だった問題だけを、同じ選択肢（並び順だけ変える）でもう一度出題する */
  const startReview = () => {
    playTapSound()
    stopConfetti()
    setQuiz({
      ...quiz,
      ...freshRound,
      phase: 'review',
      question: reshuffleChoices(history[incorrectIndices[0]].question),
      round: 1,
      review: { targets: incorrectIndices, results: [] },
    })
  }

  if (phase === 'finished') {
    const correctCount = results.filter(Boolean).length
    const rank = rankFor(correctCount)
    return (
      <Layout showLead={false}>
        {/* 結果画面は縦に長いので、上下中央ではなくヘッダーのすぐ下から並べる */}
        <main className="quiz --top">
          <section className="quiz-finish">
            <p className="quiz-finish-lead">{QUESTION_COUNT}問中</p>
            <p className="quiz-finish-score">
              <span className="quiz-finish-number">{correctCount}</span>
              問正解
            </p>
            <QuizProgress
              total={QUESTION_COUNT}
              current={null}
              results={results}
            />
          </section>

          <section className="quiz-rank">
            <p className="quiz-rank-lead">
              <span className="quiz-rank-number">{correctCount}</span>
              問正解のあなたは
            </p>
            <h2 className="quiz-rank-title">{rank.title}です。</h2>
            <p className="quiz-rank-comment">{rank.comment}</p>
          </section>

          <div className="single-action --stack">
            <button type="button" className="pill-button" onClick={restart}>
              もう一度あそぶ
              <NextIcon />
            </button>
            {incorrectIndices.length > 0 && (
              <button
                type="button"
                className="pill-button --long-label"
                onClick={startReview}
              >
                不正解だった問題を見直す
                <NextIcon />
              </button>
            )}
          </div>
        </main>
      </Layout>
    )
  }

  return (
    <Layout
      header={
        <QuizProgress
          total={roundCount}
          current={round}
          results={review ? review.results : results}
          label={review ? '見直し' : undefined}
        />
      }
      shake={selected !== null && selected.id !== question.answer.id}
    >
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
          <div key={`${phase}-${round}`} className="livly-frame --drop-in">
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
              {isLastRound ? '結果を見る' : 'つぎの問題にすすむ'}
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
