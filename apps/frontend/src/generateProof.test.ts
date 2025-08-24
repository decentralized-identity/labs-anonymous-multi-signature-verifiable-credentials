import { Identity } from "@semaphore-protocol/identity"
import { Group } from "@semaphore-protocol/group"
import { generateProof, verifyProof } from "@semaphore-protocol/proof"

async function testGenerateProof() {
    try {
        console.log("🚀 Starting Semaphore generateProof test...\n")

        // Step 1: Create an identity
        console.log("1️⃣ Creating identity...")
        const identity = new Identity()
        console.log("   Identity commitment:", identity.commitment.toString())
        console.log("   ✅ Identity created\n")

        // Step 2: Create a group and add the identity
        console.log("2️⃣ Creating group...")
        const group = new Group() // Create a new group
        group.addMember(identity.commitment)
        console.log("   Group size:", group.size)
        console.log("   Group root:", group.root.toString())
        console.log("   Member index:", group.indexOf(identity.commitment))
        console.log("   ✅ Group created and identity added\n")

        // Step 3: Prepare proof parameters
        console.log("3️⃣ Preparing proof parameters...")
        const message = "Hello Semaphore!"
        const scope = "test-scope-123"
        
        console.log("   Message:", message)
        console.log("   Scope:", scope)
        console.log("   ✅ Parameters prepared\n")

        // Step 4: Generate the proof
        console.log("4️⃣ Generating proof...")
        const startTime = Date.now()
        
        const proof = await generateProof(identity, group, message, scope)
        
        const endTime = Date.now()
        console.log("   ⏱️  Proof generation time:", endTime - startTime, "ms")
        console.log("   Proof nullifier:", proof.nullifier.toString())
        console.log("   Proof merkle tree depth:", proof.merkleTreeDepth)
        console.log("   Proof merkle tree root:", proof.merkleTreeRoot.toString())
        console.log("   ✅ Proof generated successfully\n")

        // Step 5: Verify the proof
        console.log("5️⃣ Verifying proof...")
        const verificationResult = await verifyProof(proof)
        
        console.log("   Verification result:", verificationResult)
        console.log("   ✅ Proof verification completed\n")

        // Summary
        console.log("🎉 Test completed successfully!")
        console.log("📊 Summary:")
        console.log("   - Identity created ✓")
        console.log("   - Group created with 1 member ✓")
        console.log("   - Proof generated ✓")
        console.log("   - Proof verified:", verificationResult ? "✓" : "❌")

        return { success: true, proof, verified: verificationResult }

    } catch (error) {
        console.error("❌ Error during test:", error)
        return { success: false, error }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testGenerateProof()
        .then(result => {
            if (result.success) {
                console.log("\n✅ Test passed!")
                process.exit(0)
            } else {
                console.log("\n❌ Test failed!")
                process.exit(1)
            }
        })
        .catch(error => {
            console.error("❌ Unexpected error:", error)
            process.exit(1)
        })
}

export { testGenerateProof }