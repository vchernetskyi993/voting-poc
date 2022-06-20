use anchor_lang::prelude::*;

use crate::{state::MainData, utils::MAIN_SEED};

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.main_data.owner = ctx.accounts.owner.key();
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,
    #[account(init, payer = owner, space = 8 + 32, seeds = [MAIN_SEED], bump)]
    pub main_data: Account<'info, MainData>,
    pub system_program: Program<'info, System>,
}
