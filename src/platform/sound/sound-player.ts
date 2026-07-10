import type { SoundPack, SoundSettings } from '@/features/settings/domain/settings'
import { clamp } from '@/shared/domain/primitives'

type Tone = {
  readonly frequency: number
  readonly duration: number
  readonly delay: number
  readonly type: OscillatorType
}

const soundPacks: Record<SoundPack, readonly Tone[]> = {
  soft: [
    { frequency: 540, duration: 0.08, delay: 0, type: 'sine' },
  ],
  glass: [
    { frequency: 880, duration: 0.07, delay: 0, type: 'triangle' },
    { frequency: 1320, duration: 0.11, delay: 0.04, type: 'sine' },
    { frequency: 1760, duration: 0.08, delay: 0.09, type: 'sine' },
  ],
  muted: [{ frequency: 340, duration: 0.07, delay: 0, type: 'sine' }],
  aurora: [
    { frequency: 392, duration: 0.1, delay: 0, type: 'sine' },
    { frequency: 587, duration: 0.16, delay: 0.06, type: 'triangle' },
    { frequency: 784, duration: 0.2, delay: 0.13, type: 'sine' },
  ],
  bell: [
    { frequency: 988, duration: 0.08, delay: 0, type: 'sine' },
    { frequency: 1480, duration: 0.18, delay: 0.04, type: 'triangle' },
  ],
  pulse: [
    { frequency: 440, duration: 0.06, delay: 0, type: 'square' },
    { frequency: 440, duration: 0.06, delay: 0.11, type: 'square' },
    { frequency: 660, duration: 0.09, delay: 0.22, type: 'triangle' },
  ],
  wood: [
    { frequency: 260, duration: 0.05, delay: 0, type: 'triangle' },
    { frequency: 330, duration: 0.05, delay: 0.08, type: 'triangle' },
  ],
}

const uiTonesForPack = (pack: SoundPack): readonly Tone[] =>
  soundPacks[pack].slice(0, 2).map((tone) => ({
    ...tone,
    duration: Math.min(tone.duration, 0.045),
    delay: tone.delay * 0.45,
  }))

const createAudioContext = (): AudioContext | null => {
  const AudioContextConstructor = window.AudioContext ?? window.webkitAudioContext
  return AudioContextConstructor ? new AudioContextConstructor() : null
}

const playTones = (tones: readonly Tone[], volume: number): void => {
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
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(clamp(volume, 0.001, 1), start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, end)

    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(start)
    oscillator.stop(end + 0.02)
  }

  window.setTimeout(() => void context.close(), 800)
}

export const playUiSound = (settings: SoundSettings): void => {
  if (!settings.enabled || settings.uiVolume <= 0) {
    return
  }

  playTones(uiTonesForPack(settings.uiPack), settings.uiVolume)
}

export const playAlertSound = (settings: SoundSettings): void => {
  if (!settings.enabled || settings.alertVolume <= 0) {
    return
  }

  if (settings.customAlertDataUrl !== null) {
    const audio = new Audio(settings.customAlertDataUrl)
    audio.volume = clamp(settings.alertVolume, 0, 1)
    void audio.play()
    return
  }

  playTones(soundPacks[settings.alertPack], settings.alertVolume)
}

declare global {
  interface Window {
    readonly webkitAudioContext?: typeof AudioContext
  }
}
