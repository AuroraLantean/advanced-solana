import type * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";

export const ll = console.log;
export const bn = (num: number | string) => new BN(num);

export type ConfigT = {
	owner: PublicKey;
	deadline: number;
	deposit: anchor.BN;
};

export const getConfigAcct = (
	programId: PublicKey,
	pdaName: string,
): PublicKey => {
	const [configPbk, configBump] = PublicKey.findProgramAddressSync(
		[Buffer.from("proj_config")],
		programId,
	);
	ll(pdaName, ":", configPbk.toBase58());
	return configPbk;
};
