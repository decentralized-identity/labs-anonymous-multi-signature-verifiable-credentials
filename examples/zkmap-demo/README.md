# zkMAP Demo

This demo implements the zkMAP (Zero-Knowledge Multi-party Approval Protocol) for Verifiable Credentials. It demonstrates creating a DID for a Semaphore group (not individual members) and publishing the group information in the DID Document.

## Project Structure

```
zkmap-demo/
├── backend/           # NestJS backend application (port 3001)
├── frontend/          # Next.js frontend application (port 3000)
└── README.md          # Project documentation
```

## Features

- **Group DID Creation**: Creates a DID specifically for a Semaphore group entity
- **Semaphore Integration**: Manages anonymous group membership using Semaphore protocol
- **DID Document Service Endpoints**: Publishes Semaphore group details in the DID Document
- **Member Management**: Add members to the group while maintaining privacy

## Setup

### 1. Install Dependencies

From the root directory:

```bash
pnpm install
```

### 2. Environment Variables

Backend environment variables (`backend/.env`):

```env
INFURA_PROJECT_ID=your_infura_project_id_here
KMS_SECRET_KEY=your-secret-key-at-least-32-chars-long1234567890
MONGODB_URI=mongodb://localhost:27017/zkmap-demo
```

Frontend environment variables (`frontend/.env.local`):

```env
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id_here
```

> **Note**: If INFURA_PROJECT_ID is not set, it will use the local Hardhat network.

## Running Development Server

### Run from Main Directory (Recommended)

```bash
# From root directory
pnpm dev:example
```

### Run Individually

```bash
# Run backend only
pnpm --filter @zkmap-demo/backend dev

# Run frontend only
pnpm --filter @zkmap-demo/frontend dev
```

## Build

### Build All Apps

```bash
pnpm build
```

### Build Individual Apps

```bash
# Build backend
pnpm --filter @zkmap-demo/backend build

# Build frontend
pnpm --filter @zkmap-demo/frontend build
```

## API Endpoints

API endpoints provided by the backend:

### Group APIs (port 3001)

- `POST /group/create` - Create group DID
- `POST /group/add-member` - Add member to group
- `POST /group/export-key` - Export key (for demo)

### Issuance APIs (port 3001)

- `POST /issuance/create-proposal` - Create VC issuance proposal
- `GET /issuance/get-proposal?proposalId=ID` - Get proposal details
- `POST /issuance/vote` - Vote on proposal
- `POST /issuance/vote2` - Test voting API
- `POST /issuance/issue-vc` - Issue VC

## Technologies

- **Next.js 15**: React framework
- **NestJS**: Backend framework
- **TypeScript**: Type safety
- **Veramo**: DID and VC management
- **Semaphore Protocol**: Zero-knowledge group membership
- **MongoDB**: Database for persistence
- **Ethers.js**: Ethereum interactions
