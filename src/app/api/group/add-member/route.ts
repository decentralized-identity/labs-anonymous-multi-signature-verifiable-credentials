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
    
    // Get global Group DID Service instance
    const groupDIDService = await GroupDIDService.getInstance(agent)

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