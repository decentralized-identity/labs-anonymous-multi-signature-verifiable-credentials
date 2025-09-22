import {
  IdentityManager,
  GroupManager,
  ProposalManager,
  CredentialIssuer,
  CredentialVerifier,
  ProofGenerator,
  ProofVerifier,
  StorageAdapter,
  MerkleRootHistory
} from './index'

/**
 * zkMPA Protocol orchestrator that coordinates all components
 * Zero-Knowledge Multi-party Approval Protocol
 */
export class zkMPAProtocol {
  public readonly identityManager: IdentityManager
  public readonly groupManager: GroupManager
  public readonly proposalManager: ProposalManager
  public readonly credentialIssuer: CredentialIssuer
  public readonly credentialVerifier: CredentialVerifier
  public readonly proofGenerator: ProofGenerator
  public readonly proofVerifier: ProofVerifier
  public readonly merkleRootHistory: MerkleRootHistory
  public storage?: StorageAdapter

  constructor(storage?: StorageAdapter, agent?: any) {
    this.identityManager = new IdentityManager()
    this.groupManager = new GroupManager()
    this.merkleRootHistory = new MerkleRootHistory()

    this.proposalManager = new ProposalManager(
      this.groupManager,
      storage
    )

    this.credentialIssuer = new CredentialIssuer(agent)
    this.credentialVerifier = new CredentialVerifier(
      agent,
      this.merkleRootHistory
    )

    this.proofGenerator = new ProofGenerator()
    this.proofVerifier = new ProofVerifier()

    this.storage = storage
  }

  /**
   * Initialize the protocol with storage
   */
  async initialize(): Promise<void> {
    if (this.storage?.connect) {
      await this.storage.connect()
    }
  }

  /**
   * Cleanup and disconnect
   */
  async shutdown(): Promise<void> {
    if (this.storage?.disconnect) {
      await this.storage.disconnect()
    }
  }

  /**
   * Create a new group for anonymous voting
   */
  createGroup(config: {
    id: string
    name: string
    merkleTreeDepth?: number
    did?: string
  }) {
    const group = this.groupManager.createGroup({
      ...config,
      merkleTreeDepth: config.merkleTreeDepth || 20
    })

    // Track initial merkle root
    this.merkleRootHistory.trackRoot(
      group.id,
      group.getMerkleRoot()
    )

    return group
  }

  /**
   * Complete flow: Create proposal, vote, and issue VC
   */
  async createAndApproveCredential(
    claims: any,
    groupId: string,
    approvalThreshold: number,
    votes: Array<{ identity: any; voteType: 'approve' | 'reject' }>
  ) {
    // Create proposal
    const proposal = await this.proposalManager.createProposal({
      content: claims,
      groupId,
      approvalThreshold
    })

    // Submit votes
    const group = this.groupManager.getGroup(groupId)
    if (!group) {
      throw new Error(`Group ${groupId} not found`)
    }

    for (const vote of votes) {
      const proof = await this.proofGenerator.generateVoteProof({
        identity: vote.identity,
        group: group as any,  // Cast to any to avoid type issues
        proposalId: proposal.id,
        voteType: vote.voteType,
        message: `vote-${vote.voteType}`,
        scope: `proposal-${proposal.id}`
      })

      await this.proposalManager.submitVote(proposal.id, {
        proof,
        voteType: vote.voteType,
        nullifierHash: proof.nullifier,
        merkleTreeRoot: proof.merkleTreeRoot || group.getMerkleRoot()
      })
    }

    // Check if approved
    const status = await this.proposalManager.getProposalStatus(proposal.id)
    if (status !== 'approved') {
      throw new Error(`Proposal not approved: ${status}`)
    }

    // Issue VC with evidence
    const evidence = proposal.getApprovalEvidence()
    const vc = await this.credentialIssuer.issueWithEvidence(
      claims,
      evidence,
      group.config.did || `did:group:${groupId}`
    )

    return vc
  }
}