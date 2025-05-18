#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("8WztRFKZTfdSU2J7zGX9JpGDBpBqFqEMjNRQRW9SPRSJ");

fn solana_time() -> Result<u32> {
  let clock = Clock::get().expect("clock time failed");
  let time = clock.unix_timestamp as u32;
  msg!("Solana time:{:?}", time);
  Ok(time)
}
#[program]
pub mod anchor_advanced {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
  }
}
/* TODO:
let time = solana_time()?;
require!(time >= lottery.start_time, ErrorCode::LotteryNotStarted);

quotient = numerator.div_cell(u128::from(total_denomonator));
*/
#[derive(Accounts)]
pub struct Initialize {}
