import {
  IdentityManager,
  GroupManager,
  ProposalManager,
  CredentialIssuer,
  CredentialVerifier,
  ProofGenerator,
  StorageFactory,
  zkMPAProtocol
} from './dist'

async function example() {
  console.log('🚀 zkMPA Protocol Demo\n')
  console.log('   Zero-Knowledge Multi-party Approval Protocol\n')

  // 1. Initialize protocol with in-memory storage
  const storage = StorageFactory.createMemoryAdapter()
  const protocol = new zkMPAProtocol(storage)
  await protocol.initialize()

  console.log('✅ Protocol initialized\n')

  // 2. Create a group for validators
  const group = protocol.createGroup({
    id: 'dao-validators',
    name: 'DAO Validators',
    merkleTreeDepth: 20,
    did: 'did:example:dao-validators'
  })

  console.log(`📋 Created group: ${group.config.name}`)
  console.log(`   ID: ${group.id}`)
  console.log(`   DID: ${group.config.did}\n`)

  // 3. Create identities for group members
  const alice = protocol.identityManager.createIdentity()
  const bob = protocol.identityManager.createIdentity()
  const charlie = protocol.identityManager.createIdentity()

  console.log('👥 Created 3 member identities:')
  console.log(`   Alice commitment: ${alice.commitment}`)
  console.log(`   Bob commitment: ${bob.commitment}`)
  console.log(`   Charlie commitment: ${charlie.commitment}\n`)

  // 4. Add members to group
  protocol.groupManager.addMember('dao-validators', alice.commitment)
  protocol.groupManager.addMember('dao-validators', bob.commitment)
  protocol.groupManager.addMember('dao-validators', charlie.commitment)

  console.log(`✅ Added 3 members to group`)
  console.log(`   Merkle root: ${group.getMerkleRoot()}\n`)

  // 5. Create a proposal for VC issuance
  const vcClaims = {
    credentialSubject: {
      id: 'did:example:user123',
      role: 'validator',
      level: 'senior',
      permissions: ['read', 'write', 'approve']
    }
  }

  const proposal = await protocol.proposalManager.createProposal({
    content: vcClaims,
    groupId: 'dao-validators',
    approvalThreshold: 2  // Need 2 out of 3 approvals
  })

  console.log(`📝 Created proposal: ${proposal.id}`)
  console.log(`   Approval threshold: ${proposal.approvalThreshold}`)
  console.log(`   Status: ${proposal.status}\n`)

  // 6. Members vote anonymously
  console.log('🗳️ Voting phase:')

  // Alice approves
  const aliceProof = await protocol.proofGenerator.generateVoteProof({
    identity: alice,
    group: group as any,
    proposalId: proposal.id,
    voteType: 'approve',
    message: `vote-approve`,
    scope: `proposal-${proposal.id}`
  })

  await protocol.proposalManager.submitVote(proposal.id, {
    proof: aliceProof,
    voteType: 'approve',
    nullifierHash: aliceProof.nullifier,
    merkleTreeRoot: aliceProof.merkleTreeRoot || group.getMerkleRoot()
  })
  console.log('   ✓ Alice voted (anonymously)')

  // Bob approves
  const bobProof = await protocol.proofGenerator.generateVoteProof({
    identity: bob,
    group: group as any,
    proposalId: proposal.id,
    voteType: 'approve',
    message: `vote-approve`,
    scope: `proposal-${proposal.id}`
  })

  await protocol.proposalManager.submitVote(proposal.id, {
    proof: bobProof,
    voteType: 'approve',
    nullifierHash: bobProof.nullifier,
    merkleTreeRoot: bobProof.merkleTreeRoot || group.getMerkleRoot()
  })
  console.log('   ✓ Bob voted (anonymously)')

  // Check proposal status
  const status = await protocol.proposalManager.getProposalStatus(proposal.id)
  console.log(`\n📊 Proposal status: ${status}`)
  console.log(`   Approvals: ${proposal.approvals.length}/${proposal.approvalThreshold}`)

  // 7. Issue VC with anonymous approval evidence
  if (status === 'approved') {
    const evidence = proposal.getApprovalEvidence()
    const vc = await protocol.credentialIssuer.issueWithEvidence(
      vcClaims,
      evidence,
      group.config.did!
    )

    console.log('\n🎉 Verifiable Credential issued!')
    console.log(`   Issuer: ${vc.issuer}`)
    console.log(`   Evidence type: ${vc.evidence?.[0]?.type}`)
    console.log(`   Approval count: ${evidence.approvals.count}`)
    console.log(`   Proofs: ${evidence.approvals.proofs.length} approval proofs`)

    // 8. Verify the credential
    console.log('\n🔍 Verifying credential...')
    const vcString = JSON.stringify(vc)
    const verificationResult = await protocol.credentialVerifier.verifyComplete(vcString)

    console.log(`   Signature valid: ${verificationResult.checks.signatureValid}`)
    console.log(`   Evidence valid: ${verificationResult.checks.evidenceValid}`)
    console.log(`   Threshold met: ${verificationResult.checks.thresholdMet}`)
    console.log(`   Nullifiers unique: ${verificationResult.checks.nullifiersUnique}`)
    console.log(`   Overall: ${verificationResult.valid ? '✅ VALID' : '❌ INVALID'}`)
  }

  console.log('\n✨ Demo completed!')
}

// Run the example
example().catch(console.error)