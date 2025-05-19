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
import { assert, expect } from "chai";
import { bn, type ConfigT, getConfigAcct, ll } from "./utils.ts";
let configAcct: ConfigT;

describe("Svm", () => {
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);
	const program = anchor.workspace.anchorAdvanced as Program<AnchorAdvanced>;
	const wallet = provider.wallet as anchor.Wallet;

	const svm = new LiteSVM(); //by default the LiteSVM instance includes some core programs such as the System Program and SPL Token.
	ll(
		`provider wallet: ${wallet.publicKey}, balance:	${svm.getBalance(wallet.publicKey)}`,
	);
	const pgid = program.programId;
	const configPbk = getConfigAcct(pgid, "config");

	const adamKp = new Keypair();
	const adam = adamKp.publicKey;
	svm.airdrop(adam, BigInt(LAMPORTS_PER_SOL * 100));

	const receiver = PublicKey.unique();
	const deadline = 1735689600;

	it("init_config", async () => {
		//const keypair = adamKp;
		//const auth = keypair.publicKey;
		const tx = await program.methods
			.initConfig(deadline)
			/*.accounts({
				//config: configPbk,
				auth,
			})
			.signers([keypair])*/
			.rpc();
		ll("txn signature", tx);
		configAcct = await program.account.config.fetch(configPbk);
		ll("configAcct:", JSON.stringify(configAcct));
		assert(configAcct.owner.equals(wallet.publicKey));
		assert.ok(configAcct.deadline === deadline);

		ll("configAcct.deposit:", configAcct.deposit); // prints <BN: 0>
		ll("anchor.BN", anchor.BN); // prints undefined !!??
		const balcExpected = new anchor.BN(0); //failed here: TypeError: anchor.BN is not a constructor
		assert.ok(configAcct.deposit.eq(balcExpected));
	});

	it("sending SOL", async () => {
		const blockhash = svm.latestBlockhash();
		const amtLamports = 1_000_000n;
		const ixs = [
			SystemProgram.transfer({
				fromPubkey: adamKp.publicKey,
				toPubkey: receiver,
				lamports: amtLamports,
			}),
		];
		const tx = new Transaction();
		tx.recentBlockhash = blockhash;
		tx.add(...ixs);
		tx.sign(adamKp);
		svm.sendTransaction(tx);
		const balanceAfter = svm.getBalance(receiver);
		expect(balanceAfter).eq(amtLamports);
	});

	it("time travel", async () => {
		const initialClock = svm.getClock();
		ll("initialClock:", initialClock.unixTimestamp);
		initialClock.unixTimestamp = BigInt(deadline);
		svm.setClock(initialClock);
		const newClock = svm.getClock();
		ll("newClock:", newClock.unixTimestamp);
		//const success = svm.sendTransaction(tx2);
		//expect(success).instanceOf(TransactionMetadata);
	});
});
