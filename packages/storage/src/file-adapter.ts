import { StorageAdapter, ProposalFilter, VCFilter, IssuedVC, Proposal } from './types'
import { GroupState, RootRecord } from '@zkmpa/group'
import * as fs from 'fs/promises'
import * as path from 'path'

export class FileStorageAdapter implements StorageAdapter {
  private basePath: string

  constructor(basePath: string = './storage') {
    this.basePath = basePath
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private getPath(type: string, id: string): string {
    return path.join(this.basePath, type, `${id}.json`)
  }

  private async readFile<T>(filePath: string): Promise<T | null> {
    try {
      const data = await fs.readFile(filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }

  private async writeFile(filePath: string, data: any): Promise<void> {
    const dir = path.dirname(filePath)
    await this.ensureDir(dir)
    await fs.writeFile(filePath, JSON.stringify(data, null, 2))
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File might not exist
    }
  }

  private async listFiles<T>(type: string): Promise<T[]> {
    const dir = path.join(this.basePath, type)
    await this.ensureDir(dir)

    try {
      const files = await fs.readdir(dir)
      const items: T[] = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(dir, file)
          const item = await this.readFile<T>(filePath)
          if (item) {
            items.push(item)
          }
        }
      }

      return items
    } catch (error) {
      return []
    }
  }

  async saveProposal(proposal: Proposal): Promise<void> {
    const filePath = this.getPath('proposals', proposal.id)
    await this.writeFile(filePath, proposal.toJSON())
  }

  async getProposal(id: string): Promise<Proposal | null> {
    const filePath = this.getPath('proposals', id)
    const data = await this.readFile<Proposal>(filePath)
    return data
  }

  async listProposals(filter?: ProposalFilter): Promise<Proposal[]> {
    let proposals = await this.listFiles<Proposal>('proposals')

    if (filter) {
      if (filter.groupId) {
        proposals = proposals.filter(p => p['groupId'] === filter.groupId)
      }
      if (filter.status) {
        proposals = proposals.filter(p => p['status'] === filter.status)
      }
      if (filter.createdAfter) {
        proposals = proposals.filter(p => new Date(p['createdAt']) >= filter.createdAfter!)
      }
      if (filter.createdBefore) {
        proposals = proposals.filter(p => new Date(p['createdAt']) <= filter.createdBefore!)
      }
    }

    return proposals
  }

  async deleteProposal(id: string): Promise<void> {
    const filePath = this.getPath('proposals', id)
    await this.deleteFile(filePath)
  }

  async saveGroupState(state: GroupState): Promise<void> {
    const filePath = this.getPath('groups', state.id)
    await this.writeFile(filePath, state)
  }

  async getGroupState(id: string): Promise<GroupState | null> {
    const filePath = this.getPath('groups', id)
    return await this.readFile<GroupState>(filePath)
  }

  async listGroups(): Promise<GroupState[]> {
    return await this.listFiles<GroupState>('groups')
  }

  async deleteGroup(id: string): Promise<void> {
    const groupPath = this.getPath('groups', id)
    const historyPath = this.getPath('history', id)

    await this.deleteFile(groupPath)
    await this.deleteFile(historyPath)
  }

  async saveMerkleRootHistory(record: RootRecord): Promise<void> {
    const filePath = this.getPath('history', record.groupId)
    let history = await this.readFile<RootRecord[]>(filePath) || []

    history.push(record)
    history.sort((a, b) => a.timestamp - b.timestamp)

    await this.writeFile(filePath, history)
  }

  async getMerkleRootHistory(groupId: string): Promise<RootRecord[]> {
    const filePath = this.getPath('history', groupId)
    return await this.readFile<RootRecord[]>(filePath) || []
  }

  async pruneOldRoots(groupId: string, before: Date): Promise<void> {
    const filePath = this.getPath('history', groupId)
    let history = await this.readFile<RootRecord[]>(filePath) || []

    const beforeTimestamp = before.getTime()
    history = history.filter(record => record.timestamp >= beforeTimestamp)

    await this.writeFile(filePath, history)
  }

  async saveIssuedVC(vc: IssuedVC): Promise<void> {
    const filePath = this.getPath('vcs', vc.id)
    await this.writeFile(filePath, vc)
  }

  async getIssuedVC(id: string): Promise<IssuedVC | null> {
    const filePath = this.getPath('vcs', id)
    return await this.readFile<IssuedVC>(filePath)
  }

  async listIssuedVCs(filter?: VCFilter): Promise<IssuedVC[]> {
    let vcs = await this.listFiles<IssuedVC>('vcs')

    if (filter) {
      if (filter.issuerDid) {
        vcs = vcs.filter(vc => vc.issuerDid === filter.issuerDid)
      }
      if (filter.proposalId) {
        vcs = vcs.filter(vc => vc.proposalId === filter.proposalId)
      }
      if (filter.issuedAfter) {
        vcs = vcs.filter(vc => new Date(vc.issuedAt) >= filter.issuedAfter!)
      }
      if (filter.issuedBefore) {
        vcs = vcs.filter(vc => new Date(vc.issuedAt) <= filter.issuedBefore!)
      }
    }

    return vcs
  }

  async clear(): Promise<void> {
    try {
      await fs.rm(this.basePath, { recursive: true, force: true })
    } catch (error) {
      // Directory might not exist
    }
  }

  async connect(): Promise<void> {
    await this.ensureDir(this.basePath)
  }

  async disconnect(): Promise<void> {
    // No-op for file storage
  }
}