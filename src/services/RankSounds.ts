import { type Note, note, play } from './SoundEffects'

/**
 * 結果画面で鳴らす、正解数（称号）ごとの効果音。SoundEffects の音源でその場で作る。
 * 添字が正解数（0〜10 問）に対応する
 */

/** min 以上 max 未満の乱数 */
function random(min: number, max: number) {
  return min + Math.random() * (max - min)
}

/** 0 問「通行人」: ブーイング。低い声のような音を何人分か重ね、下がりながら揺らす。約 1.6 秒 */
function booing(): Note[] {
  const voices = Array.from({ length: 6 }, (): Note => {
    const frequency = random(105, 150)
    return {
      at: random(0, 0.12),
      frequency,
      slideTo: frequency * 0.8,
      duration: random(1.3, 1.5),
      wave: 'sawtooth',
      volume: 0.14,
      attack: 0.18,
      release: 0.45,
      vibrato: { rate: random(4.5, 6.5), depth: 35 },
      // 「ウー」という口の形に近づけるため、高い成分を強めに落とす
      filter: { type: 'lowpass', frequency: 650, q: 2 },
    }
  })
  return [
    ...voices,
    // 息の混じったざわつき
    {
      at: 0,
      frequency: 400,
      duration: 1.5,
      wave: 'noise',
      volume: 0.12,
      attack: 0.2,
      release: 0.5,
    },
  ]
}

/** 1 問「うっかり迷い込んだ人」: ギィ…（扉のきしみ）＋「ポッ？」。約 1 秒 */
function creakAndQuestion(): Note[] {
  return [
    // 低くゆがんだ持続音。速く細かく揺らしてきしみに聞かせる
    {
      at: 0,
      frequency: 95,
      slideTo: 72,
      duration: 0.62,
      wave: 'sawtooth',
      volume: 0.5,
      attack: 0.04,
      release: 0.12,
      vibrato: { rate: 19, depth: 90 },
      filter: { type: 'bandpass', frequency: 900, q: 3 },
    },
    // 疑問形の「ポッ？」: 短く音程が上がる単音
    {
      at: 0.72,
      frequency: note('G5'),
      slideTo: note('D6'),
      duration: 0.16,
      wave: 'pulse',
      volume: 0.45,
      attack: 0.005,
      release: 0.06,
    },
  ]
}

/** 2 問「見学ツアー参加者」: ピンポンパンポン♪ 館内放送風の 4 音チャイム（上昇）。約 1.5 秒 */
function announcementChime(): Note[] {
  return ['F4', 'A4', 'C5', 'F5'].flatMap((name, index): Note[] => [
    {
      at: index * 0.3,
      frequency: note(name),
      duration: index === 3 ? 0.9 : 0.6,
      wave: 'sine',
      volume: 0.75,
      percussive: true,
    },
    // 1 オクターブ上をうっすら重ねて、金属の響きを少し足す
    {
      at: index * 0.3,
      frequency: note(name) * 2,
      duration: 0.35,
      wave: 'sine',
      volume: 0.15,
      percussive: true,
    },
  ])
}

/** 3 問「差し入れを持ってくる人」: ガサッ（紙袋）＋コトッ（木の打音）。約 0.8 秒 */
function bagAndKnock(): Note[] {
  // 紙袋: 高めのノイズを細かく何度か鳴らす
  const rustle = [0, 0.04, 0.09, 0.15, 0.2].map(
    (at): Note => ({
      at,
      frequency: random(2600, 3400),
      duration: random(0.05, 0.09),
      wave: 'noise',
      volume: random(0.5, 0.8),
      percussive: true,
    }),
  )
  return [
    ...rustle,
    // 木を叩くような低い打音
    {
      at: 0.5,
      frequency: 260,
      slideTo: 170,
      duration: 0.14,
      wave: 'triangle',
      volume: 0.9,
      percussive: true,
    },
    {
      at: 0.5,
      frequency: 900,
      duration: 0.05,
      wave: 'noise',
      volume: 0.4,
      percussive: true,
    },
  ]
}

/** 4 問「受付と顔なじみの人」: ピッ（ID ゲート）＋ウィーン（自動ドアが開く上昇スイープ）。約 1.2 秒 */
function gateAndDoor(): Note[] {
  return [
    {
      at: 0,
      frequency: note('B5'),
      duration: 0.11,
      wave: 'pulse',
      volume: 0.45,
    },
    // モーター音: 音程が上がっていく
    {
      at: 0.28,
      frequency: 180,
      slideTo: 520,
      duration: 0.85,
      wave: 'pulse',
      volume: 0.25,
      attack: 0.15,
      release: 0.3,
      filter: { type: 'lowpass', frequency: 1200 },
    },
    // ドアが滑る風切り音
    {
      at: 0.28,
      frequency: 0,
      duration: 0.85,
      wave: 'noise',
      volume: 0.3,
      attack: 0.2,
      release: 0.35,
      filter: { type: 'bandpass', frequency: 500, q: 1.5, to: 2000 },
    },
  ]
}

/** 5 問「白衣を試着した人」: シュッ（衣擦れ）＋ジャン♪（小さめの和音）。約 1 秒 */
function swishAndChord(): Note[] {
  return [
    {
      at: 0,
      frequency: 0,
      duration: 0.2,
      wave: 'noise',
      volume: 0.55,
      attack: 0.06,
      release: 0.1,
      filter: { type: 'bandpass', frequency: 2000, q: 1, to: 4500 },
    },
    ...['C5', 'E5', 'G5'].map(
      (name): Note => ({
        at: 0.32,
        frequency: note(name),
        duration: 0.65,
        wave: 'pulse',
        volume: 0.22,
        percussive: true,
      }),
    ),
    {
      at: 0.32,
      frequency: note('C4'),
      duration: 0.65,
      wave: 'triangle',
      volume: 0.45,
      percussive: true,
    },
  ]
}

/** ラッパ風の音（のこぎり波を丸めて、少し揺らす） */
function trumpet(
  at: number,
  name: string,
  duration: number,
  options: Partial<Note> = {},
): Note {
  return {
    at,
    frequency: note(name),
    duration,
    wave: 'sawtooth',
    volume: 0.32,
    attack: 0.02,
    release: 0.05,
    filter: { type: 'lowpass', frequency: 1800 },
    ...options,
  }
}

/** 6 問「研究員見習い（自称）」: パッパラ〜（最後の音がわざと半音下がる）。約 1.5 秒 */
function offKeyFanfare(): Note[] {
  return [
    trumpet(0, 'G4', 0.12),
    trumpet(0.16, 'G4', 0.12),
    // 「ラ〜」: いったん C5 を出してから、半音下の B4 へずり落ちて、情けなく揺れながら消える
    trumpet(0.32, 'C5', 0.3, { release: 0.02 }),
    trumpet(0.62, 'B4', 0.85, {
      attack: 0.01,
      release: 0.5,
      vibrato: { rate: 5, depth: 25 },
    }),
  ]
}

/** 7 問「助手の助手」: コポコポ（泡）＋チーン（ベル）。約 1.5 秒 */
function bubblesAndBell(): Note[] {
  const bubbles = Array.from({ length: 7 }, (_, index): Note => {
    const frequency = random(320, 650)
    return {
      at: index * random(0.07, 0.1),
      frequency,
      slideTo: frequency * 1.9,
      duration: 0.07,
      wave: 'sine',
      volume: 0.6,
      percussive: true,
    }
  })
  return [
    ...bubbles,
    // ベル: 基音に、少しずれた高い成分を重ねて金属らしくする
    {
      at: 0.75,
      frequency: note('E6'),
      duration: 0.8,
      wave: 'sine',
      volume: 0.6,
      percussive: true,
    },
    {
      at: 0.75,
      frequency: note('E6') * 2.4,
      duration: 0.35,
      wave: 'sine',
      volume: 0.12,
      percussive: true,
    },
  ]
}

/** 8 問「試験管を割らない人」: カチン（ガラス）＋キラリン✨（上昇アルペジオ）。約 1.5 秒 */
function glassAndSparkle(): Note[] {
  const sparkle = ['C6', 'E6', 'G6', 'C7', 'E7'].map(
    (name, index): Note => ({
      at: 0.3 + index * 0.06,
      frequency: note(name),
      duration: 0.5,
      wave: 'sine',
      volume: 0.4,
      percussive: true,
    }),
  )
  return [
    // ガラスが触れる高音: 整数倍でない高い成分を重ねる
    {
      at: 0,
      frequency: note('C7'),
      duration: 0.25,
      wave: 'sine',
      volume: 0.5,
      percussive: true,
    },
    {
      at: 0,
      frequency: note('C7') * 1.48,
      duration: 0.18,
      wave: 'sine',
      volume: 0.25,
      percussive: true,
    },
    ...sparkle,
    // きらめきの余韻
    ...sparkle.map((entry) => ({ ...entry, at: entry.at + 0.38, volume: 0.12 })),
  ]
}

/** 9 問「ほぼ研究員」: パッパパー…プスッ（盛り上がる直前で空気が抜ける）。約 2 秒 */
function deflatedFanfare(): Note[] {
  const harmony = (at: number, name: string, duration: number): Note[] => [
    trumpet(at, name, duration),
    { ...trumpet(at, name, duration), wave: 'pulse', volume: 0.18 },
  ]
  return [
    ...harmony(0, 'C5', 0.12),
    ...harmony(0.15, 'C5', 0.12),
    ...harmony(0.3, 'E5', 0.14),
    // 「パー…」: 堂々と伸ばして盛り上げる
    ...harmony(0.48, 'G5', 0.85).map((entry) => ({
      ...entry,
      attack: 0.05,
      release: 0.01,
      vibrato: { rate: 5.5, depth: 15 },
    })),
    // 「プスッ」: 一気に音程が落ちて止まる
    {
      at: 1.33,
      frequency: note('G5'),
      slideTo: note('G3'),
      duration: 0.18,
      wave: 'sawtooth',
      volume: 0.3,
      release: 0.06,
      filter: { type: 'lowpass', frequency: 1500 },
    },
    // 空気が抜ける音
    {
      at: 1.33,
      frequency: 0,
      duration: 0.45,
      wave: 'noise',
      volume: 0.45,
      percussive: true,
      filter: { type: 'lowpass', frequency: 1800, to: 300 },
    },
  ]
}

/** 10 問「立派な研究員」: 大歓声（ざわめき・「ワー」という声・拍手）。約 2.5 秒 */
function bigCheer(): Note[] {
  const crowd: Note[] = [
    {
      at: 0,
      frequency: 0,
      duration: 2.4,
      wave: 'noise',
      volume: 0.45,
      attack: 0.3,
      release: 1.1,
      filter: { type: 'bandpass', frequency: 1100, q: 0.6 },
    },
    {
      at: 0.05,
      frequency: 0,
      duration: 2.2,
      wave: 'noise',
      volume: 0.2,
      attack: 0.4,
      release: 1,
      filter: { type: 'bandpass', frequency: 2600, q: 0.8 },
    },
  ]
  // 「ワー」: 高めの声を何人分か、少し上がりながら揺らす
  const voices = Array.from({ length: 6 }, (): Note => {
    const frequency = random(330, 520)
    return {
      at: random(0, 0.2),
      frequency,
      slideTo: frequency * random(1.05, 1.2),
      duration: random(1.6, 2.1),
      wave: 'sawtooth',
      volume: 0.07,
      attack: 0.2,
      release: 0.8,
      vibrato: { rate: random(5, 7), depth: 30 },
      filter: { type: 'bandpass', frequency: 1000, q: 1.2 },
    }
  })
  // 拍手: 短いノイズを不規則に重ねる
  const claps = Array.from(
    { length: 28 },
    (): Note => ({
      at: random(0.15, 2.1),
      frequency: random(1200, 2200),
      duration: 0.05,
      wave: 'noise',
      volume: random(0.3, 0.6),
      percussive: true,
    }),
  )
  return [...crowd, ...voices, ...claps]
}

const RANK_SOUNDS: readonly (() => Note[])[] = [
  booing,
  creakAndQuestion,
  announcementChime,
  bagAndKnock,
  gateAndDoor,
  swishAndChord,
  offKeyFanfare,
  bubblesAndBell,
  glassAndSparkle,
  deflatedFanfare,
  bigCheer,
]

/** 「結果を見る」のボタン音と重ならないよう、少し遅らせて鳴らす（秒） */
const RANK_SOUND_DELAY = 0.15

/** 結果画面で、正解数（0〜10 問）に応じた効果音を鳴らす */
export function playRankSound(correctCount: number) {
  const index = Math.min(Math.max(correctCount, 0), RANK_SOUNDS.length - 1)
  play(RANK_SOUNDS[index](), RANK_SOUND_DELAY)
}
