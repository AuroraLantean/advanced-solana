#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
//use anchor_spl::token::TokenAccount;

declare_id!("8WztRFKZTfdSU2J7zGX9JpGDBpBqFqEMjNRQRW9SPRSJ");

const USDT_MINT: &str = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const USDC_MINT: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

pub const CONFIG: &[u8; 11] = b"proj_config";

fn solana_time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}", time);
  Ok(time)
}
#[program]
pub mod anchor_advanced {
  use super::*;

  pub fn init_config(ctx: Context<InitConfig>, deadline: u32) -> Result<()> {
    msg!("init_config: {:?}", ctx.program_id);
    //ctx: {program_id, accounts, bumps}
    let config = &mut ctx.accounts.config;
    config.owner = ctx.accounts.auth.key();
    config.deadline = deadline;
    Ok(())
  }
}

//The discriminator is the first 8 bytes of the SHA256 hash of the string account:<AccountName>. This discriminator is stored as the first 8 bytes of account data when an account is created.
#[derive(Accounts)]
pub struct InitConfig<'info> {
  #[account(
        init,
        payer = auth,
        space = 8 + Config::INIT_SPACE,
        seeds = [CONFIG],
        bump
    )]
  pub config: Account<'info, Config>,
  #[account(mut)]
  pub auth: Signer<'info>,
  pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct Config {
  pub owner: Pubkey,
  pub deadline: u32,
  pub deposit: u64,
}

#[error_code]
pub enum ErrorCode {
  // Error code: 6001
  #[msg("after deadline")]
  AfterDeadline,
}
