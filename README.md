# Veramo Semaphore Group DID Demo

This demo implements the Setup Phase of the Anonymous Multi-Party Approval Protocol for Verifiable Credentials. It demonstrates creating a DID for a Semaphore group (not individual members) and publishing the group information in the DID Document.

## Features

- **Group DID Creation**: Creates a DID specifically for a Semaphore group entity
- **Semaphore Integration**: Manages anonymous group membership using Semaphore protocol
- **DID Document Service Endpoints**: Publishes Semaphore group details in the DID Document
- **Member Management**: Add members to the group while maintaining privacy

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Configure environment variables:
Create a `.env.local` file with:
```env
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id_here
KMS_SECRET_KEY=your-secret-key-at-least-32-chars-long1234567890
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Architecture

### Key Components

- **Veramo Agent**: Manages DIDs and credentials
- **Semaphore Group Manager**: Handles anonymous group operations
- **Group DID Service**: Combines Veramo and Semaphore to create group-owned DIDs

### Group DID Structure

The group's DID Document includes:
- **Semaphore Group Service**: Contains group configuration, merkle root, and approval policy
- **Merkle Root History Service** (optional): Endpoint for historical merkle roots

Example service endpoint in DID Document:
```json
{
  "id": "did:ethr:0x123...#semaphore",
  "type": "SemaphoreGroup",
  "serviceEndpoint": {
    "type": "EthereumSmartContract",
    "groupId": "group-123",
    "merkleRoot": "0xabc...",
    "approvalPolicy": {
      "m": 2,
      "n": 3
    }
  }
}
```

## Protocol Flow

1. **Create Group**: Initialize a Semaphore group with approval policy (m of n)
2. **Issue Group DID**: Create a DID owned by the group entity
3. **Publish Group Info**: Add Semaphore details to DID Document service endpoints
4. **Add Members**: Register member identity commitments to the group

## Technologies

- **Next.js 15**: React framework
- **TypeScript**: Type safety
- **Veramo**: DID and VC management
- **Semaphore Protocol**: Zero-knowledge group membership
- **Ethers.js**: Ethereum interactions
- **TypeORM**: Database management
