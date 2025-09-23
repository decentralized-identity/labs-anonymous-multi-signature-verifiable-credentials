'use client'

import { useState } from 'react'
import GroupSetup from '@/components/GroupSetup'
import IssuancePhase from '@/components/IssuancePhase'
import VerificationPhase from '@/components/VerificationPhase'
import { Card } from '@/components/ui/Card'

export default function Home() {
  const [phase, setPhase] = useState<'setup' | 'issuance' | 'verification'>('setup')
  const [selectedGroupDid, setSelectedGroupDid] = useState('')

  const handleGroupCreated = (groupDid: string) => {
    setSelectedGroupDid(groupDid)
  }

  const phases = [
    {
      id: 'setup',
      name: 'Setup',
      description: 'Create and configure group',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      enabled: true
    },
    {
      id: 'issuance',
      name: 'Issuance',
      description: 'Request and approve VCs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      enabled: !!selectedGroupDid
    },
    {
      id: 'verification',
      name: 'Verification',
      description: 'Verify issued credentials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      enabled: true
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                zkMPA - Anonymous Multi-Party Approval for Verifiable Credentials
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Decentralized credential issuance with privacy-preserving approvals
              </p>
            </div>
            {selectedGroupDid && (
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium text-blue-900">Active Group</span>
                <code className="text-xs bg-blue-100 px-2 py-0.5 rounded">
                  {selectedGroupDid.slice(0, 20)}...
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 py-4">
            {phases.map((p) => (
              <button
                key={p.id}
                onClick={() => p.enabled && setPhase(p.id as any)}
                disabled={!p.enabled}
                className={`
                  relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200
                  ${phase === p.id
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg scale-105 shadow-blue-200'
                    : p.enabled
                    ? 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100'
                    : 'text-gray-400 cursor-not-allowed opacity-60'
                  }
                `}
              >
                {p.icon}
                <div className="text-left">
                  <div className="font-semibold">{p.name}</div>
                  <div className={`text-xs ${phase === p.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {p.description}
                  </div>
                </div>
                {phase === p.id && (
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-600 to-blue-500 rotate-45 shadow-sm"></div>
                  </div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keep all components mounted but hidden to preserve state */}
        <div style={{ display: phase === 'setup' ? 'block' : 'none' }}>
          <GroupSetup onGroupCreated={handleGroupCreated} />
        </div>

        {selectedGroupDid && (
          <div style={{ display: phase === 'issuance' ? 'block' : 'none' }}>
            <IssuancePhase groupDid={selectedGroupDid} />
          </div>
        )}

        <div style={{ display: phase === 'verification' ? 'block' : 'none' }}>
          <VerificationPhase />
        </div>
      </div>
    </main>
  )
}
