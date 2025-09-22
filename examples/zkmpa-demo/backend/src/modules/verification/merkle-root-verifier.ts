import { GroupDIDService } from '../group/group-did.service'
import { Model } from 'mongoose'
import { verifyProof } from '@semaphore-protocol/proof'
import { GroupDocument } from '../group/group.schema'
import { MerkleRootHistoryDocument } from '../group/merkle-root-history.schema'

export interface MerkleRootEntry {
  root: string
  timestamp: string
  blockNumber?: number | null
}

export interface VerificationResult {
  valid: boolean
  rootFound: boolean
  rootSource: 'did-document' | 'mongodb-archive' | 'not-found'
  rootAge?: number // in milliseconds
  message?: string
}

export class MerkleRootVerifier {
  constructor(
    private groupDIDService: GroupDIDService,
    private groupModel: Model<GroupDocument>,
    private merkleRootHistoryModel: Model<MerkleRootHistoryDocument>
  ) {}

  /**
   * Verify a proof with merkle root validation
   * 1. Check if the root exists in DID document (recent 10)
   * 2. If not found, check MongoDB archive
   * 3. Optionally validate root age
   */
  async verifyProofWithRoot(
    groupDid: string,
    proof: any,
    claimedRoot: string,
    maxRootAge?: number // optional: maximum age in milliseconds
  ): Promise<VerificationResult> {

    // Step 1: Find the merkle root
    const rootSearchResult = await this.findMerkleRoot(groupDid, claimedRoot)

    if (!rootSearchResult.found) {
      return {
        valid: false,
        rootFound: false,
        rootSource: 'not-found',
        message: 'Merkle root not found in history'
      }
    }

    // Step 2: Check root age if maxRootAge is specified
    if (maxRootAge && rootSearchResult.entry) {
      const rootDate = new Date(rootSearchResult.entry.timestamp)
      const rootAge = Date.now() - rootDate.getTime()

      if (rootAge > maxRootAge) {
        return {
          valid: false,
          rootFound: true,
          rootSource: rootSearchResult.source,
          rootAge,
          message: `Root too old: ${Math.floor(rootAge / (24 * 60 * 60 * 1000))} days old`
        }
      }
    }

    // Step 3: Verify the actual Semaphore proof
    try {
      const isProofValid = await verifyProof(proof)

      if (!isProofValid) {
        return {
          valid: false,
          rootFound: true,
          rootSource: rootSearchResult.source,
          message: 'Semaphore proof verification failed'
        }
      }

      return {
        valid: true,
        rootFound: true,
        rootSource: rootSearchResult.source,
        rootAge: rootSearchResult.entry ?
          Date.now() - new Date(rootSearchResult.entry.timestamp).getTime() :
          undefined,
        message: 'Proof and merkle root verified successfully'
      }
    } catch (error) {
      return {
        valid: false,
        rootFound: true,
        rootSource: rootSearchResult.source,
        message: `Proof verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Find a merkle root in either DID document or MongoDB archive
   */
  async findMerkleRoot(
    groupDid: string,
    targetRoot: string
  ): Promise<{
    found: boolean
    source: 'did-document' | 'mongodb-archive' | 'not-found'
    entry?: MerkleRootEntry
  }> {

    // Step 1: Get group info which includes DID document with recent roots
    try {
      const groupInfo = await this.groupDIDService.getGroupInfo(groupDid)

      if (groupInfo?.didDocument?.service) {
        // Find the MerkleRootHistory service
        const merkleService = groupInfo.didDocument.service.find(
          (s: any) => s.type === 'MerkleRootHistory'
        )

        if (merkleService?.recentRoots) {
          // Check if the target root is in the recent roots
          const foundRoot = merkleService.recentRoots.find(
            (r: MerkleRootEntry) => r.root === targetRoot
          )

          if (foundRoot) {
            return {
              found: true,
              source: 'did-document',
              entry: foundRoot
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching group info:', error)
    }

    // Step 2: If not found in DID document, search MongoDB archive
    try {
      // Extract groupId from the group DID data
      const groupData = await this.groupModel.findOne({ did: groupDid })

      if (!groupData) {
        return {
          found: false,
          source: 'not-found'
        }
      }

      // Use the searchMerkleRoot method to find in MongoDB
      const archivedRoot = await this.groupDIDService.searchMerkleRoot(
        groupData.groupId,
        targetRoot
      )

      if (archivedRoot) {
        return {
          found: true,
          source: 'mongodb-archive',
          entry: {
            root: archivedRoot.root,
            timestamp: archivedRoot.timestamp,
            blockNumber: archivedRoot.blockNumber
          }
        }
      }
    } catch (error) {
      console.error('Error searching MongoDB archive:', error)
    }

    return {
      found: false,
      source: 'not-found'
    }
  }

  /**
   * Get statistics about merkle root history
   */
  async getRootHistoryStats(groupDid: string): Promise<{
    totalRoots: number
    recentRootsInDID: number
    oldestRoot?: MerkleRootEntry
    newestRoot?: MerkleRootEntry
  }> {
    const groupData = await this.groupModel.findOne({ did: groupDid })

    if (!groupData) {
      throw new Error(`Group not found: ${groupDid}`)
    }

    // Get total count
    const totalRoots = await this.merkleRootHistoryModel.countDocuments({
      groupId: groupData.groupId
    })

    // Get oldest root
    const oldest = await this.merkleRootHistoryModel
      .findOne({ groupId: groupData.groupId })
      .sort({ createdAt: 1 })
      .exec()

    // Get newest root
    const newest = await this.merkleRootHistoryModel
      .findOne({ groupId: groupData.groupId })
      .sort({ createdAt: -1 })
      .exec()

    // Get group info to count DID document roots
    const groupInfo = await this.groupDIDService.getGroupInfo(groupDid)
    const merkleService = groupInfo?.didDocument?.service?.find(
      (s: any) => s.type === 'MerkleRootHistory'
    )
    const recentRootsCount = merkleService?.recentRoots?.length || 0

    return {
      totalRoots,
      recentRootsInDID: recentRootsCount,
      oldestRoot: oldest ? {
        root: oldest.root,
        timestamp: oldest.timestamp,
        blockNumber: oldest.blockNumber
      } : undefined,
      newestRoot: newest ? {
        root: newest.root,
        timestamp: newest.timestamp,
        blockNumber: newest.blockNumber
      } : undefined
    }
  }
}