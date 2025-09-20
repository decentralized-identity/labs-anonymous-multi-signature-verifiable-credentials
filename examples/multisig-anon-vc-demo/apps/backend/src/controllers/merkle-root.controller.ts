import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common'
import { connectToDatabase } from '../lib/db/mongodb'

@Controller('api/groups/:groupId/merkle-roots')
export class MerkleRootController {

  /**
   * Get merkle root history for a group or search for specific root
   * GET /api/groups/:groupId/merkle-roots?root=0x... (search)
   * GET /api/groups/:groupId/merkle-roots?limit=100&offset=0 (list)
   */
  @Get()
  async getMerkleRoots(
    @Param('groupId') groupId: string,
    @Query('root') root?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    // If root parameter is provided, search for specific root
    if (root) {
      return this.searchSpecificRoot(groupId, root);
    }

    // Otherwise, return paginated history
    return this.getPaginatedHistory(groupId, limit, offset);
  }

  private async searchSpecificRoot(groupId: string, root: string) {
    if (!root) {
      throw new HttpException(
        'Missing required parameter: root',
        HttpStatus.BAD_REQUEST
      )
    }

    try {
      const { db } = await connectToDatabase()
      const merkleRootHistoryCollection = db.collection('merkleRootHistory')

      const rootEntry = await merkleRootHistoryCollection.findOne({
        groupId,
        root
      })

      if (!rootEntry) {
        throw new HttpException(
          'Merkle root not found in history',
          HttpStatus.NOT_FOUND
        )
      }

      return {
        root: rootEntry.root,
        timestamp: rootEntry.timestamp,
        blockNumber: rootEntry.blockNumber,
        createdAt: rootEntry.createdAt
      }
    } catch (error) {
      if (error instanceof HttpException) throw error

      console.error('Error searching merkle root:', error)
      throw new HttpException(
        'Failed to search merkle root',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  private async getPaginatedHistory(
    groupId: string,
    limit?: string,
    offset?: string
  ) {
    try {
      const parsedLimit = limit ? parseInt(limit) : 100
      const parsedOffset = offset ? parseInt(offset) : 0

      const { db } = await connectToDatabase()
      const merkleRootHistoryCollection = db.collection('merkleRootHistory')

      // Get total count
      const totalCount = await merkleRootHistoryCollection.countDocuments({ groupId })

      // Get paginated results
      const history = await merkleRootHistoryCollection
        .find({ groupId })
        .sort({ createdAt: -1 })
        .skip(parsedOffset)
        .limit(parsedLimit)
        .toArray()

      const results = history.map(entry => ({
        root: entry.root,
        timestamp: entry.timestamp,
        blockNumber: entry.blockNumber,
        createdAt: entry.createdAt
      }))

      return {
        groupId,
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        results
      }
    } catch (error) {
      console.error('Error fetching merkle root history:', error)
      throw new HttpException(
        'Failed to fetch merkle root history',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Get statistics about merkle root history
   * GET /api/groups/:groupId/merkle-roots/stats
   */
  @Get('stats')
  async getMerkleRootStats(@Param('groupId') groupId: string) {
    try {
      const { db } = await connectToDatabase()
      const merkleRootHistoryCollection = db.collection('merkleRootHistory')

      // Get total count
      const totalCount = await merkleRootHistoryCollection.countDocuments({ groupId })

      // Get oldest and newest
      const oldest = await merkleRootHistoryCollection
        .findOne({ groupId }, { sort: { createdAt: 1 } })

      const newest = await merkleRootHistoryCollection
        .findOne({ groupId }, { sort: { createdAt: -1 } })

      return {
        groupId,
        totalRoots: totalCount,
        oldestRoot: oldest ? {
          root: oldest.root,
          timestamp: oldest.timestamp,
          createdAt: oldest.createdAt
        } : null,
        newestRoot: newest ? {
          root: newest.root,
          timestamp: newest.timestamp,
          createdAt: newest.createdAt
        } : null
      }
    } catch (error) {
      console.error('Error fetching merkle root stats:', error)
      throw new HttpException(
        'Failed to fetch merkle root statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}