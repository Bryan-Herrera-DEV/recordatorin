import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppBootstrap } from '@/app/providers/AppBootstrap'
import { useAppStore } from '@/app/store/app-store'
import { AppShell } from '@/app/layout/AppShell'
import { NotesPage } from '@/features/notes/NotesPage'
import { OnboardingPage } from '@/features/onboarding/OnboardingPage'
import { RemindersPage } from '@/features/reminders/RemindersPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function RequireOnboarding({ children }: { readonly children: React.ReactNode }) {
  const completed = useAppStore((state) => state.snapshot.settings.onboardingCompleted)
  return completed ? children : <Navigate to="/onboarding" replace />
}

function RedirectWhenOnboarded({ children }: { readonly children: React.ReactNode }) {
  const completed = useAppStore((state) => state.snapshot.settings.onboardingCompleted)
  return completed ? <Navigate to="/notes" replace /> : children
}

export default function App() {
  return (
    <AppBootstrap>
      <HashRouter>
        <Routes>
          <Route
            path="/onboarding"
            element={
              <RedirectWhenOnboarded>
                <OnboardingPage />
              </RedirectWhenOnboarded>
            }
          />
          <Route
            path="/"
            element={
              <RequireOnboarding>
                <AppShell />
              </RequireOnboarding>
            }
          >
            <Route index element={<Navigate to="/notes" replace />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/notes" replace />} />
        </Routes>
      </HashRouter>
    </AppBootstrap>
  )
}
