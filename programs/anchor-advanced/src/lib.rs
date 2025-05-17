#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("8WztRFKZTfdSU2J7zGX9JpGDBpBqFqEMjNRQRW9SPRSJ");

#[program]
pub mod anchor_advanced {
  use super::*;

  pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    msg!("Greetings from: {:?}", ctx.program_id);
    Ok(())
  }
}

#[derive(Accounts)]
pub struct Initialize {}
