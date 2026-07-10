import type { SoundPack, SoundSettings } from '@/features/settings/domain/settings'
import { clamp } from '@/shared/domain/primitives'

type Tone = {
  readonly frequency: number
  readonly duration: number
  readonly delay: number
  readonly type: OscillatorType
  readonly gain?: number
  readonly attack?: number
  readonly release?: number
  readonly detune?: number
  readonly endFrequency?: number
}

const minGain = 0.0001

const soundPacks: Record<SoundPack, readonly Tone[]> = {
  soft: [
    {
      frequency: 540,
      duration: 0.08,
      delay: 0,
      type: 'sine',
    },
  ],
  glass: [
    {
      frequency: 1046.5,
      duration: 0.16,
      delay: 0,
      type: 'sine',
      gain: 0.34,
      attack: 0.003,
      release: 0.13,
    },
    {
      frequency: 1567.98,
      duration: 0.21,
      delay: 0.028,
      type: 'sine',
      gain: 0.2,
      attack: 0.003,
      release: 0.18,
      detune: 2,
    },
    {
      frequency: 2093,
      duration: 0.17,
      delay: 0.07,
      type: 'triangle',
      gain: 0.08,
      attack: 0.002,
      release: 0.15,
      detune: -3,
    },
  ],
  muted: [
    {
      frequency: 294,
      endFrequency: 220,
      duration: 0.09,
      delay: 0,
      type: 'sine',
      gain: 0.28,
      attack: 0.003,
      release: 0.075,
    },
    {
      frequency: 440,
      endFrequency: 330,
      duration: 0.06,
      delay: 0.022,
      type: 'triangle',
      gain: 0.1,
      attack: 0.002,
      release: 0.05,
    },
  ],
  aurora: [
    {
      frequency: 392,
      duration: 0.24,
      delay: 0,
      type: 'sine',
      gain: 0.24,
      attack: 0.012,
      release: 0.18,
    },
    {
      frequency: 493.88,
      duration: 0.29,
      delay: 0.05,
      type: 'sine',
      gain: 0.18,
      attack: 0.014,
      release: 0.22,
      detune: -2,
    },
    {
      frequency: 659.25,
      duration: 0.34,
      delay: 0.11,
      type: 'triangle',
      gain: 0.13,
      attack: 0.016,
      release: 0.26,
      detune: 2,
    },
    {
      frequency: 783.99,
      duration: 0.3,
      delay: 0.17,
      type: 'sine',
      gain: 0.07,
      attack: 0.012,
      release: 0.24,
    },
  ],
  bell: [
    {
      frequency: 783.99,
      duration: 0.32,
      delay: 0,
      type: 'sine',
      gain: 0.3,
      attack: 0.002,
      release: 0.29,
    },
    {
      frequency: 1567.98,
      duration: 0.37,
      delay: 0.012,
      type: 'sine',
      gain: 0.12,
      attack: 0.002,
      release: 0.34,
      detune: 3,
    },
    {
      frequency: 2351.97,
      duration: 0.27,
      delay: 0.026,
      type: 'sine',
      gain: 0.045,
      attack: 0.001,
      release: 0.25,
      detune: -4,
    },
  ],
  pulse: [
    {
      frequency: 440,
      duration: 0.065,
      delay: 0,
      type: 'triangle',
      gain: 0.22,
      attack: 0.002,
      release: 0.052,
    },
    {
      frequency: 440,
      duration: 0.065,
      delay: 0.105,
      type: 'triangle',
      gain: 0.18,
      attack: 0.002,
      release: 0.052,
    },
    {
      frequency: 659.25,
      duration: 0.13,
      delay: 0.21,
      type: 'sine',
      gain: 0.24,
      attack: 0.004,
      release: 0.105,
    },
    {
      frequency: 880,
      duration: 0.09,
      delay: 0.245,
      type: 'sine',
      gain: 0.07,
      attack: 0.003,
      release: 0.075,
    },
  ],
  wood: [
    {
      frequency: 330,
      endFrequency: 220,
      duration: 0.07,
      delay: 0,
      type: 'triangle',
      gain: 0.32,
      attack: 0.0015,
      release: 0.06,
    },
    {
      frequency: 495,
      endFrequency: 300,
      duration: 0.047,
      delay: 0.012,
      type: 'sine',
      gain: 0.12,
      attack: 0.001,
      release: 0.04,
    },
    {
      frequency: 247,
      endFrequency: 196,
      duration: 0.065,
      delay: 0.085,
      type: 'triangle',
      gain: 0.22,
      attack: 0.0015,
      release: 0.055,
    },
  ],
}

const uiTonesForPack = (pack: SoundPack): readonly Tone[] => {
  if (pack === 'soft') {
    return soundPacks.soft.slice(0, 2).map((tone) => ({
      ...tone,
      duration: Math.min(tone.duration, 0.045),
      delay: tone.delay * 0.45,
    }))
  }

  return soundPacks[pack].slice(0, 2).map((tone) => {
    const duration = Math.min(tone.duration, 0.085)

    return {
      ...tone,
      duration,
      delay: tone.delay * 0.4,
      gain: (tone.gain ?? 0.3) * 0.72,
      attack: Math.min(tone.attack ?? 0.004, 0.004),
      release: Math.min(tone.release ?? duration * 0.8, duration * 0.8),
    }
  })
}

const createAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext
  return AudioContextConstructor ? new AudioContextConstructor() : null
}

let sharedAudioContext: AudioContext | null = null

const getSharedAudioContext = (): AudioContext | null => {
  if (sharedAudioContext === null || sharedAudioContext.state === 'closed') {
    sharedAudioContext = createAudioContext()
  }

  return sharedAudioContext
}

const playLegacyTones = (tones: readonly Tone[], volume: number): void => {
  const context = createAudioContext()
  if (context === null) {
    return
  }

  const masterGain = context.createGain()
  masterGain.gain.value = clamp(volume, 0, 1)
  masterGain.connect(context.destination)

  for (const tone of tones) {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + tone.delay
    const end = start + tone.duration

    oscillator.type = tone.type
    oscillator.frequency.value = tone.frequency
    gain.gain.setValueAtTime(minGain, start)
    gain.gain.exponentialRampToValueAtTime(clamp(volume, 0.001, 1), start + 0.015)
    gain.gain.exponentialRampToValueAtTime(minGain, end)

    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }

  window.setTimeout(() => void context.close(), 800)
}

const scheduleEnhancedTones = (context: AudioContext, tones: readonly Tone[], volume: number): void => {
  if (tones.length === 0) {
    return
  }

  const masterGain = context.createGain()
  const compressor = context.createDynamicsCompressor()
  const now = context.currentTime

  masterGain.gain.setValueAtTime(clamp(volume, 0, 1), now)
  compressor.threshold.setValueAtTime(-14, now)
  compressor.knee.setValueAtTime(10, now)
  compressor.ratio.setValueAtTime(3, now)
  compressor.attack.setValueAtTime(0.003, now)
  compressor.release.setValueAtTime(0.16, now)

  masterGain.connect(compressor)
  compressor.connect(context.destination)

  let activeOscillators = tones.length

  for (const tone of tones) {
    const oscillator = context.createOscillator()
    const toneGain = context.createGain()
    const start = now + 0.008 + tone.delay
    const end = start + tone.duration
    const attack = Math.min(Math.max(tone.attack ?? 0.004, 0.001), tone.duration * 0.45)
    const release = Math.min(Math.max(tone.release ?? tone.duration * 0.75, 0.005), tone.duration - attack)
    const attackEnd = start + attack
    const releaseStart = Math.max(attackEnd, end - release)
    const peakGain = clamp(tone.gain ?? 0.3, minGain, 1)

    oscillator.type = tone.type
    oscillator.frequency.setValueAtTime(tone.frequency, start)

    if (tone.endFrequency !== undefined && tone.endFrequency > 0) {
      oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end)
    }

    if (tone.detune !== undefined) {
      oscillator.detune.setValueAtTime(tone.detune, start)
    }

    toneGain.gain.setValueAtTime(minGain, start)
    toneGain.gain.exponentialRampToValueAtTime(peakGain, attackEnd)
    toneGain.gain.setValueAtTime(peakGain, releaseStart)
    toneGain.gain.exponentialRampToValueAtTime(minGain, end)

    oscillator.connect(toneGain)
    toneGain.connect(masterGain)
    oscillator.addEventListener(
      'ended',
      () => {
        oscillator.disconnect()
        toneGain.disconnect()

        activeOscillators -= 1
        if (activeOscillators === 0) {
          masterGain.disconnect()
          compressor.disconnect()
        }
      },
      { once: true },
    )

    oscillator.start(start)
    oscillator.stop(end + 0.015)
  }
}

const playEnhancedTones = (tones: readonly Tone[], volume: number): void => {
  const context = getSharedAudioContext()
  if (context === null) {
    return
  }

  const schedule = (): void => {
    scheduleEnhancedTones(context, tones, clamp(volume, 0, 1))
  }

  if (context.state === 'suspended') {
    void context.resume().then(schedule).catch(() => undefined)
    return
  }

  schedule()
}

const playPackTones = (pack: SoundPack, tones: readonly Tone[], volume: number): void => {
  if (pack === 'soft') {
    playLegacyTones(tones, volume)
    return
  }

  playEnhancedTones(tones, volume)
}

export const playUiSound = (settings: SoundSettings): void => {
  if (!settings.enabled || settings.uiVolume <= 0) {
    return
  }

  playPackTones(settings.uiPack, uiTonesForPack(settings.uiPack), settings.uiVolume)
}

export const playAlertSound = (settings: SoundSettings): void => {
  if (!settings.enabled || settings.alertVolume <= 0) {
    return
  }

  if (settings.customAlertDataUrl !== null) {
    const audio = new Audio(settings.customAlertDataUrl)
    audio.volume = clamp(settings.alertVolume, 0, 1)
    void audio.play().catch(() => undefined)
    return
  }

  playPackTones(settings.alertPack, soundPacks[settings.alertPack], settings.alertVolume)
}

declare global {
  interface Window {
    readonly webkitAudioContext?: typeof AudioContext
  }
}
