import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  navigation?: ReactNode
}

export function AppShell({ children, navigation }: AppShellProps) {
  return (
    <div className="app-background">
      <main className="app-shell-card">
        {navigation}
        <div className="app-shell-content">{children}</div>
      </main>
    </div>
  )
}
