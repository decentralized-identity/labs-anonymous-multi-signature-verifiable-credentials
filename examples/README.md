# Examples

This directory contains example implementations of the Anonymous Multi-Party Approval Protocol.

## Available Examples

### [multisig-anon-vc-demo](./multisig-anon-vc-demo/)
Full-stack implementation demonstrating:
- Group DID creation with Semaphore
- Dynamic approval policies per VC
- Anonymous voting using zero-knowledge proofs
- VC issuance with cryptographic evidence

#### Running the Demo
```bash
cd multisig-anon-vc-demo
pnpm install
pnpm dev:all  # Runs both frontend and backend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Future Examples
- Mobile application example
- Smart contract integration
- Multi-chain support
- Federated group management