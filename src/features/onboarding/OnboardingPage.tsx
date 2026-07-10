import { startTransition, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Locale } from '@/features/settings/domain/settings'
import { useAppStore } from '@/app/store/app-store'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'

export function OnboardingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const [name, setName] = useState('')
  const [locale, setLocale] = useState<Locale>('es')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void completeOnboarding(name, locale).then(() => {
      startTransition(() => {
        void navigate('/notes')
      })
    })
  }

  return (
    <div className="grid min-h-screen place-items-center p-5">
      <Card className="w-full max-w-2xl p-8 text-center">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-3xl bg-[var(--primary)] text-3xl font-bold text-[var(--primary-foreground)] shadow-xl shadow-black/10">
          R
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{t('onboardingTitle')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 opacity-75">{t('onboardingSubtitle')}</p>

        <form className="mx-auto mt-8 grid max-w-md gap-4 text-left" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium">
            {t('yourName')}
            <Input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            {t('language')}
            <Select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </Select>
          </label>
          <Button type="submit" size="lg" className="mt-2">
            {t('start')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
