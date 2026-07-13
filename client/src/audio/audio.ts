interface ToneSpec {
  readonly frequency: number
  readonly type: OscillatorType
  readonly startOffset: number
  readonly duration: number
  readonly peakGain: number
}

interface AudioSetup {
  readonly context: AudioContext
  readonly masterGain: GainNode
}

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let muted = false

function ensureContext(): AudioSetup | null {
  if (typeof AudioContext === 'undefined') {
    return null
  }

  if (!audioContext || !masterGain) {
    audioContext = new AudioContext()
    masterGain = audioContext.createGain()
    masterGain.gain.value = muted ? 0 : 1
    masterGain.connect(audioContext.destination)
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return { context: audioContext, masterGain }
}

function playTone(setup: AudioSetup, spec: ToneSpec): void {
  const { context, masterGain: destination } = setup
  const startTime = context.currentTime + spec.startOffset
  const endTime = startTime + spec.duration

  const oscillator = context.createOscillator()
  oscillator.type = spec.type
  oscillator.frequency.value = spec.frequency

  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0, startTime)
  envelope.gain.linearRampToValueAtTime(spec.peakGain, startTime + 0.01)
  envelope.gain.linearRampToValueAtTime(0, endTime)

  oscillator.connect(envelope)
  envelope.connect(destination)

  oscillator.start(startTime)
  oscillator.stop(endTime)
}

function playSequence(specs: readonly ToneSpec[]): void {
  const setup = ensureContext()
  if (!setup) {
    return
  }
  for (const spec of specs) {
    playTone(setup, spec)
  }
}

/** A short, bright single tone for placing or moving a piece. */
export function playPlace(): void {
  playSequence([{ frequency: 440, type: 'sine', startOffset: 0, duration: 0.08, peakGain: 0.2 }])
}

/** A rising two-note chime, distinct from a plain placement, for forming a mill. */
export function playMill(): void {
  playSequence([
    { frequency: 523.25, type: 'sine', startOffset: 0, duration: 0.1, peakGain: 0.22 },
    { frequency: 659.25, type: 'sine', startOffset: 0.09, duration: 0.14, peakGain: 0.22 },
  ])
}

/** A single harsher, lower buzz for a capture. */
export function playCapture(): void {
  playSequence([
    { frequency: 196, type: 'sawtooth', startOffset: 0, duration: 0.16, peakGain: 0.18 },
  ])
}

/** A three-note ascending arpeggio for a win. */
export function playWin(): void {
  playSequence([
    { frequency: 523.25, type: 'sine', startOffset: 0, duration: 0.12, peakGain: 0.22 },
    { frequency: 659.25, type: 'sine', startOffset: 0.11, duration: 0.12, peakGain: 0.22 },
    { frequency: 783.99, type: 'sine', startOffset: 0.22, duration: 0.24, peakGain: 0.24 },
  ])
}

/** Two flat, neutral-pitched tones for a draw. */
export function playDraw(): void {
  playSequence([
    { frequency: 349.23, type: 'triangle', startOffset: 0, duration: 0.16, peakGain: 0.18 },
    { frequency: 349.23, type: 'triangle', startOffset: 0.18, duration: 0.16, peakGain: 0.18 },
  ])
}

/**
 * Mutes/unmutes by gating the shared master gain rather than tearing down the
 * AudioContext (D-12), so unmuting is instant with no re-initialization delay.
 */
export function setMuted(nextMuted: boolean): void {
  muted = nextMuted
  const setup = ensureContext()
  if (setup) {
    setup.masterGain.gain.value = muted ? 0 : 1
  }
}

export function isMuted(): boolean {
  return muted
}
