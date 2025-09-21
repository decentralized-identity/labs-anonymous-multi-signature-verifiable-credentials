import { StorageFactory, StorageAdapter, StorageConfig } from './types'
import { InMemoryStorageAdapter } from './memory-adapter'
import { FileStorageAdapter } from './file-adapter'

export class StorageFactoryImpl implements StorageFactory {
  createAdapter(config: StorageConfig): StorageAdapter {
    switch (config.type) {
      case 'memory':
        return new InMemoryStorageAdapter()

      case 'file':
        return new FileStorageAdapter(config.options?.basePath || './storage')

      case 'mongodb':
        throw new Error('MongoDB adapter not yet implemented. Use memory or file adapter.')

      case 'postgres':
        throw new Error('PostgreSQL adapter not yet implemented. Use memory or file adapter.')

      default:
        throw new Error(`Unknown storage type: ${config.type}`)
    }
  }

  static createMemoryAdapter(): StorageAdapter {
    return new InMemoryStorageAdapter()
  }

  static createFileAdapter(basePath?: string): StorageAdapter {
    return new FileStorageAdapter(basePath)
  }
}