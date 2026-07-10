import type { SoundSettings } from '@/features/settings/domain/settings'
import { clamp } from '@/shared/domain/primitives'

type Tone = {
  readonly frequency: number
  readonly duration: number
  readonly delay: number
  readonly type: OscillatorType
}

const soundPacks: Record<SoundSettings['pack'], readonly Tone[]> = {
  soft: [
    { frequency: 540, duration: 0.08, delay: 0, type: 'sine' },
    { frequency: 780, duration: 0.16, delay: 0.05, type: 'sine' },
  ],
  glass: [
    { frequency: 880, duration: 0.07, delay: 0, type: 'triangle' },
    { frequency: 1320, duration: 0.11, delay: 0.04, type: 'sine' },
    { frequency: 1760, duration: 0.08, delay: 0.09, type: 'sine' },
  ],
  muted: [{ frequency: 340, duration: 0.07, delay: 0, type: 'sine' }],
}

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

  playTones([{ frequency: 620, duration: 0.035, delay: 0, type: 'sine' }], settings.uiVolume)
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

  playTones(soundPacks[settings.pack], settings.alertVolume)
}

declare global {
  interface Window {
    readonly webkitAudioContext?: typeof AudioContext
  }
}
