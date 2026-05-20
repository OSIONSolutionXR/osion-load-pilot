interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <main className="pt-10 md:pt-12 pb-16">
      <div className={`container-premium ${className}`}>
        {children}
      </div>
    </main>
  )
}
