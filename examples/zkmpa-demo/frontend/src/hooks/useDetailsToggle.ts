import { useState } from 'react'

export function useDetailsToggle(initialState = false) {
  const [showDetails, setShowDetails] = useState(initialState)

  const toggleDetails = () => {
    setShowDetails(prev => !prev)
  }

  const hideDetails = () => {
    setShowDetails(false)
  }

  const showDetailsPanel = () => {
    setShowDetails(true)
  }

  return {
    showDetails,
    setShowDetails,
    toggleDetails,
    hideDetails,
    showDetailsPanel
  }
}