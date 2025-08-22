import { NextRequest, NextResponse } from 'next/server'
import { initializeAgent } from '@/lib/veramo/agent'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kid } = body // Key ID from the DID

    const agent = await initializeAgent()
    
    // Export the private key (DANGEROUS - only for demo!)
    const key = await agent.keyManagerGet({ kid })
    
    // Get the private key in hex format
    const privateKeyHex = key.privateKeyHex

    return NextResponse.json({
      success: true,
      data: {
        kid: key.kid,
        type: key.type,
        publicKeyHex: key.publicKeyHex,
        privateKeyHex: privateKeyHex, // NEVER expose in production!
        warning: 'This private key should NEVER be exposed in production!'
      },
    })
  } catch (error) {
    console.error('Error exporting key:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}