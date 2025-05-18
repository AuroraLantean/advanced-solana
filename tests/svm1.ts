import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { AnchorAdvanced } from "../target/types/anchor_advanced.js";
import {
	LiteSVM,
	TransactionMetadata,
	FailedTransactionMetadata,
} from "litesvm";
import {
	PublicKey,
	Transaction,
	TransactionInstruction,
	SystemProgram,
	Keypair,
	LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { expect } from "chai";

const ll = console.log;

describe("Svm", () => {
	anchor.setProvider(anchor.AnchorProvider.env());
	const program = anchor.workspace.anchorAdvanced as Program<AnchorAdvanced>;

	const svm = new LiteSVM(); //by default the LiteSVM instance includes some core programs such as the System Program and SPL Token.
	const payer = new Keypair();
	svm.airdrop(payer.publicKey, BigInt(LAMPORTS_PER_SOL));
	const receiver = PublicKey.unique();

	it("Is initialized!", async () => {
		const tx = await program.methods.initialize().rpc();
		ll("txn signature", tx);
	});

	it("sending SOL", async () => {
		const blockhash = svm.latestBlockhash();
		const amtLamports = 1_000_000n;
		const ixs = [
			SystemProgram.transfer({
				fromPubkey: payer.publicKey,
				toPubkey: receiver,
				lamports: amtLamports,
			}),
		];
		const tx = new Transaction();
		tx.recentBlockhash = blockhash;
		tx.add(...ixs);
		tx.sign(payer);
		svm.sendTransaction(tx);
		const balanceAfter = svm.getBalance(receiver);
		expect(balanceAfter).eq(amtLamports);
	});

	it("time travel", async () => {
		const initialClock = svm.getClock();
		ll("initialClock:", initialClock.unixTimestamp);
		initialClock.unixTimestamp = 1735689600n;
		svm.setClock(initialClock);
		const newClock = svm.getClock();
		ll("newClock:", newClock.unixTimestamp);
		//const success = svm.sendTransaction(tx2);
		//expect(success).instanceOf(TransactionMetadata);
	});
});
