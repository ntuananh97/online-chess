'use client'

import { cn } from '@/lib/utils'

type Tab = 'moves'

interface MobileTabBarProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <div className="flex border-b border-border bg-background">
      <button
        onClick={() => onTabChange('moves')}
        className={cn(
          '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
          activeTab === 'moves'
            ? 'border-primary text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        )}
      >
        Moves
      </button>
    </div>
  )
}
