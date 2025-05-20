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
  msg!("Solana time:{:?}, slot:{:?}", time, clock.slot);
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
  pub fn pay_sol(ctx: Context<PaySol>, amt: u64) -> Result<()> {
    msg!("pay_sol()...");
    let config = &mut ctx.accounts.config;
    let time = solana_time()?;
    require!(time < config.deadline, ErrorCode::AfterDeadline);
    config.deposit += amt;
    // quotient = numerator.div_cell(u128::from(total_denomonator));
    Ok(())
  }
}
#[derive(Accounts)]
pub struct PaySol<'info> {
  #[account(mut, seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  //pub mint: InterfaceAccount<'info, Mint>,
  //pub token_acct: Account<'info, TokenAccount>,
  pub user: Signer<'info>,
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
  // Error code: 6000
  #[msg("after deadline")]
  AfterDeadline,
}
