import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { AnchorAdvanced } from "../target/types/anchor_advanced";

describe("anchor-advanced", () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.AnchorProvider.env());

	const program = anchor.workspace.anchorAdvanced as Program<AnchorAdvanced>;

	it("Is initialized!", async () => {
		// Add your test here.
		const tx = await program.methods.initialize().rpc();
		console.log("Your transaction signature", tx);
	});
});
