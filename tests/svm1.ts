import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import type { AnchorAdvanced } from "../target/types/anchor_advanced.js";
import {
	Clock,
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
let keypair: Keypair;
let amount: number;
let tx: string;

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
	const deadline = 1767139200;

	it("init_config", async () => {
		//const keypair = adamKp;
		//const auth = keypair.publicKey;
		tx = await program.methods
			.initConfig(deadline)
			/*.accounts({
				//config: configPbk,
				auth,
			})
			.signers([keypair])*/
			.rpc();
		ll("init:", tx);
		configAcct = await program.account.config.fetch(configPbk);
		//ll("configAcct:", JSON.stringify(configAcct));
		assert(configAcct.owner.equals(wallet.publicKey));
		assert.ok(configAcct.deadline === deadline);

		ll("configAcct.deposit:", configAcct.deposit);
		const balcExpected = bn(0);
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
		const clock = svm.getClock();
		ll("clock:", clock.slot, clock.unixTimestamp);

		keypair = adamKp;
		amount = 100;
		tx = await program.methods
			.paySol(bn(amount))
			.accounts({
				//config: configPbk,
				user: keypair.publicKey,
			})
			.signers([keypair])
			.rpc();
		ll("paySol tx:", tx);

		clock.unixTimestamp = BigInt(deadline);
		svm.setClock(clock);
		svm.warpToSlot(1000n);
		const clock1 = svm.getClock();
		ll("clock1:", clock1.slot, clock1.unixTimestamp);

		tx = await program.methods
			.paySol(bn(amount))
			.accounts({
				//config: configPbk,
				user: keypair.publicKey,
			})
			.signers([keypair])
			.rpc();
		ll("paySol tx:", tx);

		//const success = svm.sendTransaction(tx2);
		//expect(success).instanceOf(TransactionMetadata);
	});
});
