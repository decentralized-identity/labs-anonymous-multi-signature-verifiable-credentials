import { MerkleRootHistory, RootRecord } from './types'

export class MerkleRootHistoryImpl implements MerkleRootHistory {
  private history: Map<string, RootRecord[]> = new Map()

  trackRoot(groupId: string, root: bigint, timestamp?: number): void {
    if (!this.history.has(groupId)) {
      this.history.set(groupId, [])
    }

    const record: RootRecord = {
      groupId,
      root: root.toString(),
      timestamp: timestamp || Date.now()
    }

    const groupHistory = this.history.get(groupId)!
    groupHistory.push(record)

    // Sort by timestamp
    groupHistory.sort((a, b) => a.timestamp - b.timestamp)
  }

  verifyHistoricalRoot(groupId: string, root: bigint, maxAge?: number): boolean {
    const groupHistory = this.history.get(groupId)
    if (!groupHistory || groupHistory.length === 0) {
      return false
    }

    const rootStr = root.toString()
    const now = Date.now()
    const minTimestamp = maxAge ? now - maxAge : 0

    return groupHistory.some(record =>
      record.root === rootStr && record.timestamp >= minTimestamp
    )
  }

  getRootHistory(groupId: string): RootRecord[] {
    return this.history.get(groupId) || []
  }

  pruneOldRoots(groupId: string, maxAge: number): void {
    const groupHistory = this.history.get(groupId)
    if (!groupHistory) return

    const now = Date.now()
    const minTimestamp = now - maxAge

    const prunedHistory = groupHistory.filter(record =>
      record.timestamp >= minTimestamp
    )

    this.history.set(groupId, prunedHistory)
  }

  getAllHistory(): Map<string, RootRecord[]> {
    return new Map(this.history)
  }

  clearHistory(groupId?: string): void {
    if (groupId) {
      this.history.delete(groupId)
    } else {
      this.history.clear()
    }
  }
}