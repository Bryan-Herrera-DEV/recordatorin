import { useEffect } from 'react'
import { useAppStore } from '@/app/store/app-store'
import { applyTheme } from '@/platform/theme/apply-theme'
import { playAlertSound, playUiSound } from '@/platform/sound/sound-player'
import i18n from '@/app/i18n'

type AppBootstrapProps = {
  readonly children: React.ReactNode
}

export function AppBootstrap({ children }: AppBootstrapProps) {
  const hydrate = useAppStore((state) => state.hydrate)
  const hydrated = useAppStore((state) => state.hydrated)
  const snapshot = useAppStore((state) => state.snapshot)
  const applyExternalSnapshot = useAppStore((state) => state.applyExternalSnapshot)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    applyTheme(snapshot.settings.theme)
    void i18n.changeLanguage(snapshot.settings.locale)
  }, [snapshot.settings.locale, snapshot.settings.theme])

  useEffect(() => {
    const removeReminderListener = window.recordatorin?.onReminderTriggered((payload) => {
      applyExternalSnapshot(payload.snapshot)
      playAlertSound(useAppStore.getState().snapshot.settings.sounds)
    })
    const removeNotificationClickListener = window.recordatorin?.onReminderNotificationClicked((payload) => {
      applyExternalSnapshot(payload.snapshot)
      useAppStore.getState().setSelectedReminderId(payload.reminderId)
      window.location.hash = '/reminders'
    })
    const removeSnapshotListener = window.recordatorin?.onSnapshotUpdated((nextSnapshot) => {
      applyExternalSnapshot(nextSnapshot)
    })

    return () => {
      removeReminderListener?.()
      removeNotificationClickListener?.()
      removeSnapshotListener?.()
    }
  }, [applyExternalSnapshot])

  useEffect(() => {
    const handlePointerUp = (event: PointerEvent): void => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      const interactive = target.closest('button,a,input,textarea,select,[role="button"]')
      if (interactive !== null) {
        playUiSound(useAppStore.getState().snapshot.settings.sounds)
      }
    }

    document.addEventListener('pointerup', handlePointerUp, { passive: true })
    return () => document.removeEventListener('pointerup', handlePointerUp)
  }, [])

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center text-[var(--foreground)]">{i18n.t('loading')}</div>
  }

  return children
}
