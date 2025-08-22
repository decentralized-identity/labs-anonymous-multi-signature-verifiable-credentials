import { NextRequest, NextResponse } from 'next/server'
import { initializeAgent } from '@/lib/veramo/agent'
import { GroupDIDService } from '@/lib/services/group-did-service-mongo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { groupName, groupDescription, m, n, contractAddress, chainId, merkleRootHistoryEndpoint } = body
    console.log('body', body)
    // Initialize Veramo agent
    const agent = await initializeAgent()
    
    // Get global Group DID Service instance
    const groupDIDService = await GroupDIDService.getInstance(agent)

    // Create Group DID
    const result = await groupDIDService.createGroupDID({
      groupName,
      groupDescription,
      approvalPolicy: { m, n },
      semaphoreContractAddress: contractAddress,
      chainId,
      merkleRootHistoryEndpoint,
    })

    // Get the full group info including DID Document
    const groupInfo = await groupDIDService.getGroupInfo(result.did.did)

    return NextResponse.json({
      success: true,
      data: groupInfo,
    })
  } catch (error) {
    console.error('Error creating group DID:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}