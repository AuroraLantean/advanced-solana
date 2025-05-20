#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
  transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

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
  pub fn transfer_lamports(ctx: Context<TransferLamports>, amt: u64) -> Result<()> {
    msg!("transfer_lamports()...");
    let config = &mut ctx.accounts.config;
    let time = solana_time()?;
    require!(time < config.deadline, ErrorCode::AfterDeadline);
    config.deposit += amt;

    //https://www.quicknode.com/guides/solana-development/anchor/transfer-tokens
    let from_account = &ctx.accounts.from;
    let to_account = &ctx.accounts.to;
    let lamports = from_account.get_lamports();
    let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
      from_account.key,
      to_account.key,
      amt,
    );

    anchor_lang::solana_program::program::invoke_signed(
      &transfer_instruction,
      &[
        from_account.to_account_info(),
        to_account.clone(),
        ctx.accounts.system_program.to_account_info(),
      ],
      &[],
    )?;
    // quotient = numerator.div_cell(u128::from(total_denomonator));
    Ok(())
  }

  pub fn transfer_spl_tokens(ctx: Context<TransferSpl>, amount: u64) -> Result<()> {
    let destination = &ctx.accounts.to_ata;
    let source = &ctx.accounts.from_ata;
    let token_program = &ctx.accounts.token_program;
    let authority = &ctx.accounts.from;
    let mint = &ctx.accounts.mint;

    let cpi_accounts = TransferChecked {
      from: source.to_account_info().clone(),
      to: destination.to_account_info().clone(),
      authority: authority.to_account_info().clone(),
      mint: mint.to_account_info().clone(),
    };
    let cpi_program = token_program.to_account_info();

    transfer_checked(
      CpiContext::new(cpi_program, cpi_accounts),
      amount,
      ctx.accounts.mint.decimals,
    )?;
    Ok(())
  }
}
#[derive(Accounts)]
pub struct TransferSpl<'info> {
  pub from: Signer<'info>,
  #[account(mut)]
  pub from_ata: InterfaceAccount<'info, TokenAccount>,
  #[account(mut)]
  pub to_ata: InterfaceAccount<'info, TokenAccount>,
  pub mint: InterfaceAccount<'info, Mint>,
  pub token_program: Interface<'info, TokenInterface>,
}
#[derive(Accounts)]
pub struct TransferLamports<'info> {
  #[account(mut, seeds = [CONFIG], bump)]
  pub config: Account<'info, Config>,
  //pub mint: InterfaceAccount<'info, Mint>,
  //pub token_acct: Account<'info, TokenAccount>,
  pub from: Signer<'info>,
  #[account(mut)]
  /// CHECK:
  pub to: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
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
