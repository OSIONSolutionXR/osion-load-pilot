interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-tech-grid relative">
      {/* Ambient Glows */}
      <div className="ambient-glow ambient-violet top-0 left-1/4 w-[600px] h-[500px]" />
      <div className="ambient-glow ambient-blue bottom-0 right-1/4 w-[500px] h-[500px]" />
      <div className="ambient-glow ambient-rose top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-20" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
