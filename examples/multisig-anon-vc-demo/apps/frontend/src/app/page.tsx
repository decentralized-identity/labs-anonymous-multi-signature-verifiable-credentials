'use client'

import { useState } from 'react'
import GroupSetup from '@/components/GroupSetup'
import IssuancePhase from '@/components/IssuancePhase'
import VerificationPhase from '@/components/VerificationPhase'

export default function Home() {
  const [phase, setPhase] = useState<'setup' | 'issuance' | 'verification'>('setup')
  const [selectedGroupDid, setSelectedGroupDid] = useState('')

  const handleGroupCreated = (groupDid: string) => {
    setSelectedGroupDid(groupDid)
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Anonymous Multi-Party Approval Protocol Demo</h1>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setPhase('setup')}
              className={`px-4 py-2 rounded-md ${
                phase === 'setup' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Setup Phase
            </button>
            
            <button
              onClick={() => setPhase('issuance')}
              disabled={!selectedGroupDid}
              className={`px-4 py-2 rounded-md ${
                phase === 'issuance' && selectedGroupDid
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Issuance Phase
            </button>

            <button
              onClick={() => setPhase('verification')}
              className={`px-4 py-2 rounded-md ${
                phase === 'verification'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Verification Phase
            </button>
          </div>
          
          {selectedGroupDid && (
            <div className="text-sm text-gray-600">
              <strong>Selected Group DID:</strong> <code className="text-xs">{selectedGroupDid}</code>
            </div>
          )}
        </div>
      </div>

      {phase === 'setup' && (
        <GroupSetup onGroupCreated={handleGroupCreated} />
      )}

      {phase === 'issuance' && selectedGroupDid && (
        <IssuancePhase groupDid={selectedGroupDid} />
      )}

      {phase === 'verification' && (
        <VerificationPhase />
      )}
    </main>
  )
}
