# Anonymous Multi-Party Approval Protocol for Verifiable Credentials

A comprehensive implementation of anonymous multi-party approval systems for verifiable credentials using Semaphore zero-knowledge proofs.

## 🏗️ Project Structure

```
.
├── docs/           # Protocol documentation and specifications
├── examples/       # Example implementations
│   └── multisig-anon-vc-demo/  # Full-stack demo application
└── packages/       # Reusable packages (planned)
```

## 🚀 Quick Start

### Run the Demo Example

```bash
# Install dependencies
pnpm install

# Run the full-stack demo
pnpm dev:example

# Or navigate to the example directly
cd examples/multisig-anon-vc-demo
pnpm dev:all
```

## 📚 Documentation

- [Protocol Documentation](./docs/README.md)
- [Example Implementation](./examples/multisig-anon-vc-demo/README.md)
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

This repository provides a reference implementation of the Anonymous Multi-Party Approval Protocol specification, including utility libraries to make it easier to implement this specification:

- **Utility libraries** provide reusable components and helper functions
- **Protocol specification** documented in `./docs/README.md`
- **Working demo** available in `./examples/multisig-anon-vc-demo/`

The utility libraries are designed to simplify the implementation of the protocol by handling complex cryptographic operations, DID document management, and verification workflows.

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