import { NextRequest, NextResponse } from 'next/server'
import { initializeAgent } from '@/lib/veramo/agent'
import { GroupDIDService } from '@/lib/services/group-did-service'
import { Identity } from '@semaphore-protocol/identity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupDid, memberSecret } = body

    // Initialize Veramo agent
    const agent = await initializeAgent()
    
    // Initialize Group DID Service
    const groupDIDService = new GroupDIDService()
    await groupDIDService.initialize(agent)

    // Create member identity
    const memberIdentity = new Identity(memberSecret)

    // Add member to group
    await groupDIDService.addMemberToGroup(groupDid, memberIdentity)

    // Get updated group info
    const groupInfo = await groupDIDService.getGroupInfo(groupDid)

    return NextResponse.json({
      success: true,
      data: {
        memberCommitment: memberIdentity.commitment.toString(),
        updatedGroup: groupInfo,
      },
    })
  } catch (error) {
    console.error('Error adding member to group:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}