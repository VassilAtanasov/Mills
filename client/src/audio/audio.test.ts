import { afterEach, describe, expect, it, vi } from 'vitest'

class FakeParam {
  value = 0
  setValueAtTime(value: number): FakeParam {
    this.value = value
    return this
  }
  linearRampToValueAtTime(value: number): FakeParam {
    this.value = value
    return this
  }
}

class FakeGainNode {
  gain = new FakeParam()
  connect(): void {}
}

class FakeOscillatorNode {
  type: OscillatorType = 'sine'
  frequency = new FakeParam()
  connect(): void {}
  start(): void {}
  stop(): void {}
}

class FakeAudioContext {
  static instanceCount = 0
  currentTime = 0
  state = 'running'
  destination = {}

  constructor() {
    FakeAudioContext.instanceCount += 1
  }

  createGain(): FakeGainNode {
    return new FakeGainNode()
  }
  createOscillator(): FakeOscillatorNode {
    return new FakeOscillatorNode()
  }
  resume(): void {}
}

async function freshAudioModule() {
  vi.resetModules()
  FakeAudioContext.instanceCount = 0
  vi.stubGlobal('AudioContext', FakeAudioContext)
  return import('./audio')
}

describe('audio: tone triggering', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('lazily creates exactly one AudioContext, reused across calls', async () => {
    const audio = await freshAudioModule()
    audio.playPlace()
    audio.playMill()
    expect(FakeAudioContext.instanceCount).toBe(1)
  })

  it('creates a distinct number/type of oscillators per event, so each cue is audibly different', async () => {
    const audio = await freshAudioModule()
    const created: { type: OscillatorType; frequency: number }[] = []
    vi.spyOn(FakeAudioContext.prototype, 'createOscillator').mockImplementation(() => {
      const osc = new FakeOscillatorNode()
      created.push({ type: osc.type, frequency: osc.frequency.value })
      return osc
    })

    audio.playPlace()
    const afterPlace = created.length

    audio.playMill()
    const afterMill = created.length

    audio.playCapture()
    const afterCapture = created.length

    audio.playWin()
    const afterWin = created.length

    audio.playDraw()
    const afterDraw = created.length

    expect(afterPlace).toBe(1) // place: one tone
    expect(afterMill - afterPlace).toBe(2) // mill: two-note chime
    expect(afterCapture - afterMill).toBe(1) // capture: one harsher tone
    expect(afterWin - afterCapture).toBe(3) // win: three-note arpeggio
    expect(afterDraw - afterWin).toBe(2) // draw: two flat tones
  })

  it('uses a different waveform/frequency for capture than for a plain placement', async () => {
    const audio = await freshAudioModule()
    const created: FakeOscillatorNode[] = []
    vi.spyOn(FakeAudioContext.prototype, 'createOscillator').mockImplementation(() => {
      const osc = new FakeOscillatorNode()
      created.push(osc)
      return osc
    })

    audio.playPlace()
    audio.playCapture()

    const [place, capture] = created
    expect(place.type).not.toBe(capture.type)
    expect(place.frequency.value).not.toBe(capture.frequency.value)
  })

  it('does not throw when the Web Audio API is unavailable', async () => {
    vi.resetModules()
    vi.stubGlobal('AudioContext', undefined)
    const audio = await import('./audio')

    expect(() => audio.playPlace()).not.toThrow()
    expect(() => audio.playWin()).not.toThrow()
    expect(() => audio.setMuted(true)).not.toThrow()
  })
})

describe('audio: mute toggle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('defaults to unmuted', async () => {
    const audio = await freshAudioModule()
    expect(audio.isMuted()).toBe(false)
  })

  it('reports the muted state after toggling', async () => {
    const audio = await freshAudioModule()
    audio.playPlace() // creates the context/master gain

    audio.setMuted(true)
    expect(audio.isMuted()).toBe(true)

    audio.setMuted(false)
    expect(audio.isMuted()).toBe(false)
  })

  it('mutes/unmutes by gating gain, never by recreating the AudioContext', async () => {
    const audio = await freshAudioModule()
    audio.playPlace()
    expect(FakeAudioContext.instanceCount).toBe(1)

    audio.setMuted(true)
    audio.setMuted(false)
    audio.playMill()

    expect(FakeAudioContext.instanceCount).toBe(1)
  })

  it('keeps the master gain at zero across further playback while muted', async () => {
    const audio = await freshAudioModule()
    const captured: { masterGain: FakeGainNode | null } = { masterGain: null }
    vi.spyOn(FakeAudioContext.prototype, 'createGain').mockImplementation(() => {
      const gain = new FakeGainNode()
      if (!captured.masterGain) {
        captured.masterGain = gain // the first GainNode created is the shared master gain
      }
      return gain
    })

    audio.setMuted(true)
    audio.playPlace()
    audio.playCapture()

    expect(captured.masterGain?.gain.value).toBe(0)
  })

  it('restores the master gain to full when unmuted', async () => {
    const audio = await freshAudioModule()
    const captured: { masterGain: FakeGainNode | null } = { masterGain: null }
    vi.spyOn(FakeAudioContext.prototype, 'createGain').mockImplementation(() => {
      const gain = new FakeGainNode()
      if (!captured.masterGain) {
        captured.masterGain = gain
      }
      return gain
    })

    audio.setMuted(true)
    audio.setMuted(false)

    expect(captured.masterGain?.gain.value).toBe(1)
  })
})
