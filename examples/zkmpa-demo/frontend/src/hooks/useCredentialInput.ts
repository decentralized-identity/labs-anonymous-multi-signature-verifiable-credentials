import { useState } from 'react'
import { decodeJWT } from '@/utils/jwt'

export function useCredentialInput() {
  const [credential, setCredential] = useState('')

  // Computed value - decoded JWT
  const decodedCredential = credential.trim() ? decodeJWT(credential) : null

  const clearCredential = () => {
    setCredential('')
  }

  return {
    credential,
    decodedCredential,
    setCredential,
    clearCredential
  }
}