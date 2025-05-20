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
import {
	getAssociatedTokenAddressSync,
	AccountLayout,
	ACCOUNT_SIZE,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { expect } from "chai";
import { bn, type ConfigT, getConfigAcct, ll } from "./utils.ts";

let configAcct: ConfigT;
let keypair: Keypair;
let amount: number;
let tx: string;
const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

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
	const bobKp = new Keypair();
	const bob = bobKp.publicKey;
	svm.airdrop(adam, BigInt(LAMPORTS_PER_SOL * 100));
	svm.airdrop(bob, BigInt(LAMPORTS_PER_SOL * 100));

	const receiver = PublicKey.unique();
	const deadline = 1767139200;
	let to: PublicKey;

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
		expect(configAcct.owner.equals(wallet.publicKey));
		expect(configAcct.deadline).equals(deadline);

		ll("configAcct.deposit:", configAcct.deposit);
		const balcExpected = bn(0);
		expect(configAcct.deposit.eq(balcExpected));
	});

	it("sending SOL via SVM", async () => {
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

	it("time travel + send lamports", async () => {
		const clock = svm.getClock();
		ll("clock:", clock.slot, clock.unixTimestamp);

		keypair = adamKp;
		to = bob;
		amount = 100;
		tx = await program.methods
			.transferLamports(bn(amount))
			.accounts({
				//config: configPbk,
				from: keypair.publicKey,
				to,
			})
			.signers([keypair])
			.rpc();
		ll("transferLamports tx:", tx);

		clock.unixTimestamp = BigInt(deadline);
		svm.setClock(clock);
		svm.warpToSlot(1000n);
		const clock1 = svm.getClock();
		ll("clock1:", clock1.slot, clock1.unixTimestamp);

		tx = await program.methods
			.transferLamports(bn(amount))
			.accounts({
				//config: configPbk,
				from: keypair.publicKey,
				to,
			})
			.signers([keypair])
			.rpc();
		ll("transferLamports tx:", tx);

		//const success = svm.sendTransaction(tx2);
		//expect(success).instanceOf(TransactionMetadata);
	});

	it("set token amount", async () => {
		const owner = adam; //PublicKey.unique();
		const amtUSDC = 1_000_000_000_000n;
		const amtLamports = 1 * LAMPORTS_PER_SOL;
		ll("amtUSDC:", amtUSDC);

		const ata = getAssociatedTokenAddressSync(usdcMint, owner, true);
		const tokenAccData = Buffer.alloc(ACCOUNT_SIZE);
		AccountLayout.encode(
			{
				mint: usdcMint,
				owner,
				amount: amtUSDC,
				delegateOption: 0,
				delegate: PublicKey.default,
				delegatedAmount: 0n,
				state: 1,
				isNativeOption: 0,
				isNative: 0n,
				closeAuthorityOption: 0,
				closeAuthority: PublicKey.default,
			},
			tokenAccData,
		);
		//const svm = new LiteSVM();
		svm.setAccount(ata, {
			lamports: amtLamports,
			data: tokenAccData,
			owner: TOKEN_PROGRAM_ID,
			executable: false,
		});
		const rawAccount = svm.getAccount(ata);
		expect(rawAccount).not.null;
		const rawAccountData = rawAccount?.data;
		const decoded = AccountLayout.decode(rawAccountData);
		ll("decoded.amount:", decoded.amount);
		expect(decoded.amount).eq(amtUSDC);
	});
});
