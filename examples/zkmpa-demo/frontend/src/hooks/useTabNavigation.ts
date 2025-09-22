import { useState } from 'react'
import { TabType } from '@/types/issuance'

export function useTabNavigation(initialTab: TabType = 'create') {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab)
  }

  return {
    activeTab,
    setActiveTab,
    navigateToTab
  }
}