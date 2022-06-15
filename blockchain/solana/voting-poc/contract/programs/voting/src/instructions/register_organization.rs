use anchor_lang::prelude::*;

use crate::{
    errors::GeneralErrors,
    state::{MainData, OrganizationData},
    utils::{organization_seed, MAIN_SEED},
};

pub fn register_organization(
    ctx: Context<RegisterOrganization>,
    _organization: Pubkey,
) -> Result<()> {
    require_keys_eq!(
        ctx.accounts.owner.key(),
        ctx.accounts.main_data.owner,
        GeneralErrors::OnlyOwner
    );
    ctx.accounts.organization_data.elections_count = 0;
    Ok(())
}

#[derive(Accounts)]
#[instruction(_organization: Pubkey)]
pub struct RegisterOrganization<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,
    #[account(seeds = [MAIN_SEED], bump)]
    pub main_data: Account<'info, MainData>,
    #[account(
        init, payer = owner, space = 8 + 16,
        seeds = [&organization_seed(&_organization)],
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    pub system_program: Program<'info, System>,
}
