# zkMAP - Zero-Knowledge Multi-party Approval Protocol for Verifiable Credentials
[![DIF Labs Project](https://img.shields.io/badge/DIF_Labs_Project-v1-black?style=for-the-badge&labelColor=%23000000&color=%2300ff00)](https://github.com/decentralized-identity/labs/blob/main/proposals/beta-cohort-2-2025/anon-multi-sig-vc/anon_multi_sig_vc_proposal.md)

A comprehensive implementation of zkMAP (Zero-Knowledge Multi-party Approval Protocol) for verifiable credentials using Semaphore zero-knowledge proofs.

## 🏗️ Project Structure

```
.
├── docs/           # Protocol documentation and specifications
├── examples/       # Example implementations
│   └── zkmap-demo/              # Full-stack zkMAP demo application
└── packages/       # Core zkMAP packages
    ├── @zkmap/core       # Main protocol implementation
    ├── @zkmap/identity   # Identity management
    ├── @zkmap/group      # Group management
    ├── @zkmap/proposal   # Proposal and voting
    ├── @zkmap/credential # VC issuance/verification
    ├── @zkmap/proof      # ZK proof generation
    └── @zkmap/storage    # Storage adapters
```

## 🚀 Quick Start

### Run the Demo Example

```bash
# Install dependencies
pnpm install

# Run the full-stack demo
pnpm dev:example

# Or navigate to the example directly
cd examples/zkmap-demo
pnpm dev:all
```

## 📚 Documentation

- [Protocol Documentation](./docs/README.md)
- [Example Implementation](./examples/zkmap-demo/README.md)
- [API Reference](./docs/api-reference.md)

## 🔑 Key Features

### Anonymous Voting
- Zero-knowledge proofs via Semaphore protocol
- Privacy-preserving member participation
- Cryptographic nullifier prevention of double voting

### Dynamic Approval Policies
- Per-credential approval thresholds
- Flexible governance models
- Context-aware policy application

### Group DIDs
- Collective entity representation
- W3C DID standard compliance
- Veramo integration

### Verifiable Credentials
- W3C VC standard
- Cryptographic evidence of approval
- JWT-based proof format

## 🛠️ Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: NestJS, TypeScript
- **Cryptography**: Semaphore Protocol, snarkjs
- **Identity**: Veramo, DIDs
- **Database**: MongoDB
- **Blockchain**: Ethereum (Sepolia testnet)

## 📦 Reference Implementation

This repository provides a reference implementation of zkMAP (Zero-Knowledge Multi-party Approval Protocol), including core packages to make it easier to implement this protocol:

- **Core packages** (`@zkmap/*`) provide reusable components and protocol implementation
- **Protocol specification** documented in `./docs/README.md`
- **Working demo** available in `./examples/zkmap-demo/`

The zkMAP packages are designed to simplify the implementation of the protocol by handling complex cryptographic operations, DID document management, and verification workflows.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs.

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- [Semaphore Protocol](https://semaphore.appliedzkp.org/)
- [Veramo Framework](https://veramo.io/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [W3C Decentralized Identifiers](https://www.w3.org/TR/did-core/)

## 🙏 Acknowledgments

This project builds upon the work of:
- Semaphore Protocol team
- Veramo Framework team
- W3C DID and VC Working Groups
