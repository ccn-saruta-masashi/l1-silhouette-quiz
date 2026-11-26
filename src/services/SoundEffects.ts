/**
 * レトロゲーム風の効果音。音声ファイルは使わず、Web Audio API でその場で鳴らす。
 *
 * 昔のゲーム機の音源にならい、パルス波（デューティ比 25% の矩形波）・三角波・ノイズを中心に作る。
 * 耳ざわりにならないよう、全体の音量を控えめにし、ローパスフィルターで高い倍音を丸め、
 * 音の終わりは短くフェードアウトさせる（ブツッというノイズを防ぐ）。
 */

/** 全体の音量（0〜1） */
const MASTER_VOLUME = 0.22
/** これより高い倍音を丸める周波数（Hz）。矩形波のキンキンした感じを抑える */
const LOWPASS_FREQUENCY = 3200

interface Engine {
  context: AudioContext
  output: AudioNode
  pulse: PeriodicWave
  /**
   * ホワイトノイズ（2 秒分。長い音はくり返して使う）。スイッチの「カチッ」や
   * 紙袋の「ガサッ」、歓声のざわめきなど、音程のない音に使う
   */
  noise: AudioBuffer
}

let engine: Engine | null = null

/** ノイズの長さ（秒）。短いとくり返しが周期的な「ブーン」という音に聞こえるので、長めに作る */
const NOISE_DURATION = 2

/**
 * デューティ比 duty の矩形波（パルス波）を作る。
 * 50% の矩形波より細く明るい音になり、昔のゲーム機らしさが出る
 */
function createPulseWave(context: AudioContext, duty: number): PeriodicWave {
  const harmonics = 32
  const real = new Float32Array(harmonics)
  const imag = new Float32Array(harmonics)
  for (let n = 1; n < harmonics; n++) {
    real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty)
  }
  return context.createPeriodicWave(real, imag)
}

function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * NOISE_DURATION),
    context.sampleRate,
  )
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/**
 * 最初に鳴らすときに AudioContext を作る。ブラウザは操作（タップ）の中でないと
 * 音を出せないため、ボタンを押したときの処理から呼ばれる前提
 */
function getEngine(): Engine | null {
  if (engine) {
    if (engine.context.state === 'suspended') void engine.context.resume()
    return engine
  }
  if (typeof AudioContext === 'undefined') return null

  const context = new AudioContext()
  const master = context.createGain()
  master.gain.value = MASTER_VOLUME
  const lowpass = context.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = LOWPASS_FREQUENCY
  master.connect(lowpass).connect(context.destination)

  engine = {
    context,
    output: master,
    pulse: createPulseWave(context, 0.25),
    noise: createNoiseBuffer(context),
  }
  return engine
}

export interface Note {
  /** 鳴らし始めるまでの時間（秒） */
  at: number
  /** 周波数（Hz）。noise では、ノイズのうち残す帯域の中心（filter を指定しないとき） */
  frequency: number
  /** 長さ（秒） */
  duration: number
  /**
   * 音色。pulse は明るく、triangle は柔らかく、sine はさらに丸い（チャイムやベル）。
   * sawtooth はざらついた音（ラッパや声）。noise は音程のない「カチッ」「ガサッ」
   */
  wave: 'pulse' | 'triangle' | 'sine' | 'sawtooth' | 'noise'
  /** 音量（0〜1、全体の音量に対する割合） */
  volume: number
  /** 指定すると、鳴っている間にこの周波数まで滑らかに変える */
  slideTo?: number
  /** true なら、鳴った瞬間から急に減衰させる（打つような短い音）。省略時は長さいっぱい鳴らす */
  percussive?: boolean
  /** 立ち上がりの時間（秒）。長くするとふわっと始まる。percussive では使わない */
  attack?: number
  /** 消えるまでの時間（秒）。長くするとゆっくり消える。percussive では使わない */
  release?: number
  /** 音程の揺れ。rate は 1 秒あたりの回数、depth は揺れ幅（セント。100 で半音） */
  vibrato?: { rate: number; depth: number }
  /** この音だけにかけるフィルター。to を指定すると、鳴っている間にその周波数まで動かす */
  filter?: { type: BiquadFilterType; frequency: number; q?: number; to?: number }
}

/** 音を並べて鳴らす。delay（秒）を指定すると、全体をその分遅らせる */
export function play(notes: Note[], delay = 0) {
  const current = getEngine()
  if (!current) return
  const { context, output, pulse, noise } = current
  const now = context.currentTime + 0.01 + delay

  for (const note of notes) {
    const start = now + note.at
    const end = start + note.duration

    const gain = context.createGain()
    gain.gain.setValueAtTime(0, start)
    if (note.percussive) {
      // 一瞬で立ち上がり、すぐに消える。スイッチを弾いたような手応えになる
      gain.gain.linearRampToValueAtTime(note.volume, start + 0.001)
      gain.gain.exponentialRampToValueAtTime(0.001, end)
    } else {
      // 立ち上がりと終わりをなめらかにして、プツッという音を防ぐ
      const attack = Math.min(note.attack ?? 0.005, note.duration / 2)
      const release = Math.min(note.release ?? 0.03, note.duration - attack)
      gain.gain.linearRampToValueAtTime(note.volume, start + attack)
      gain.gain.setValueAtTime(note.volume, end - release)
      gain.gain.linearRampToValueAtTime(0, end)
    }
    gain.connect(output)

    // ノイズは filter の指定がなければ、frequency を中心に帯域を残す
    const filterOptions =
      note.filter ??
      (note.wave === 'noise'
        ? { type: 'bandpass' as const, frequency: note.frequency, q: 1.2 }
        : undefined)
    let destination: AudioNode = gain
    if (filterOptions) {
      const filter = context.createBiquadFilter()
      filter.type = filterOptions.type
      filter.frequency.setValueAtTime(filterOptions.frequency, start)
      if (filterOptions.to) {
        filter.frequency.exponentialRampToValueAtTime(filterOptions.to, end)
      }
      filter.Q.value = filterOptions.q ?? 1
      filter.connect(gain)
      destination = filter
    }

    let source: AudioScheduledSourceNode
    if (note.wave === 'noise') {
      const buffer = context.createBufferSource()
      buffer.buffer = noise
      buffer.loop = true
      buffer.connect(destination)
      // 毎回ノイズの違う場所から鳴らし、同じ音のくり返しに聞こえないようにする
      buffer.start(start, Math.random() * NOISE_DURATION)
      source = buffer
    } else {
      const oscillator = context.createOscillator()
      if (note.wave === 'pulse') oscillator.setPeriodicWave(pulse)
      else oscillator.type = note.wave
      oscillator.frequency.setValueAtTime(note.frequency, start)
      if (note.slideTo) {
        oscillator.frequency.exponentialRampToValueAtTime(note.slideTo, end)
      }
      if (note.vibrato) {
        const lfo = context.createOscillator()
        lfo.frequency.value = note.vibrato.rate
        const depth = context.createGain()
        depth.gain.value = note.vibrato.depth
        lfo.connect(depth).connect(oscillator.detune)
        lfo.start(start)
        lfo.stop(end + 0.01)
      }
      oscillator.connect(destination)
      oscillator.start(start)
      source = oscillator
    }
    source.stop(end + 0.01)
  }
}

/** 同じオクターブの A から数えた半音の数 */
const SEMITONES_FROM_A: Record<string, number> = {
  C: -9,
  D: -7,
  E: -5,
  F: -4,
  G: -2,
  A: 0,
  B: 2,
}

/** 音名（C4 など）を周波数にする。A4 = 440Hz の平均律 */
export function note(name: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(name)
  if (!match) throw new Error(`Invalid note: ${name}`)
  const [, letter, sharp, octave] = match
  const fromA4 =
    SEMITONES_FROM_A[letter] + (sharp ? 1 : 0) + (Number(octave) - 4) * 12
  return 440 * 2 ** (fromA4 / 12)
}

/**
 * ボタンを押したときの「カチッ」。スイッチを押し込んで戻るように、ごく短い打音を 2 つ重ねる。
 * それぞれノイズの打音に、音程が急に落ちる短い三角波を足して、プラスチックのような硬さを出す
 */
export function playTapSound() {
  play([
    // 「カ」: 押し込む音。少し低めでしっかり
    {
      at: 0,
      frequency: 2400,
      duration: 0.025,
      wave: 'noise',
      volume: 0.9,
      percussive: true,
    },
    {
      at: 0,
      frequency: 1800,
      slideTo: 600,
      duration: 0.02,
      wave: 'triangle',
      volume: 0.7,
      percussive: true,
    },
    // 「チ」: 戻る音。高めで小さく
    {
      at: 0.045,
      frequency: 3000,
      duration: 0.018,
      wave: 'noise',
      volume: 0.5,
      percussive: true,
    },
    {
      at: 0.045,
      frequency: 2400,
      slideTo: 900,
      duration: 0.015,
      wave: 'triangle',
      volume: 0.35,
      percussive: true,
    },
  ])
}

/** 正解の音。上がっていく明るいアルペジオのあと、最後の音を少し伸ばしてきらっとさせる */
export function playCorrectSound() {
  const step = 0.075
  const melody = ['G5', 'C6', 'E6', 'G6']
  play([
    ...melody.map((name, index) => ({
      at: index * step,
      frequency: note(name),
      duration: index === melody.length - 1 ? 0.28 : step,
      wave: 'pulse' as const,
      volume: 0.55,
    })),
    // 1 オクターブ下を三角波で重ね、厚みと柔らかさを足す
    ...melody.map((name, index) => ({
      at: index * step,
      frequency: note(name) / 2,
      duration: index === melody.length - 1 ? 0.28 : step,
      wave: 'triangle' as const,
      volume: 0.5,
    })),
    // 少し遅れた小さなこだまで、きらっとした余韻を出す
    {
      at: melody.length * step + 0.06,
      frequency: note('G6'),
      duration: 0.16,
      wave: 'pulse',
      volume: 0.18,
    },
  ])
}

/** 不正解の音。低めの 2 音で下がり、最後は音程を落として「しょんぼり」させる */
export function playIncorrectSound() {
  play([
    {
      at: 0,
      frequency: note('E4'),
      duration: 0.12,
      wave: 'pulse',
      volume: 0.4,
    },
    {
      at: 0,
      frequency: note('E3'),
      duration: 0.12,
      wave: 'triangle',
      volume: 0.6,
    },
    {
      at: 0.14,
      frequency: note('C4'),
      slideTo: note('G3'),
      duration: 0.34,
      wave: 'pulse',
      volume: 0.4,
    },
    {
      at: 0.14,
      frequency: note('C3'),
      slideTo: note('G2'),
      duration: 0.34,
      wave: 'triangle',
      volume: 0.6,
    },
  ])
}
