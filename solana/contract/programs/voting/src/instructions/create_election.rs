use anchor_lang::{
    prelude::*,
    solana_program::{self, native_token::sol_to_lamports},
};

use crate::{
    errors::ElectionErrors,
    state::{AnchorLen, ElectionData, ElectionInput, MainData, OrganizationData},
    utils::{election_seed, organization_seed, MAIN_SEED},
};

pub fn create_election(ctx: Context<CreateElection>, input: ElectionInput) -> Result<()> {
    require_gt!(
        input.candidates.len(),
        1,
        ElectionErrors::InvalidCandidatesCount
    );
    require_gt!(
        input.start,
        Clock::get().unwrap().unix_timestamp,
        ElectionErrors::InvalidStartDate
    );
    require_gt!(input.end, input.start, ElectionErrors::InvalidEndDate);
    let payment = sol_to_lamports(0.01);
    if ctx.accounts.organization.try_lamports()? < payment {
        return err!(ElectionErrors::InsufficientFundsToCreateElection);
    }
    solana_program::program::invoke(
        &solana_program::system_instruction::transfer(
            &ctx.accounts.organization.key,
            &ctx.accounts.owner.key,
            payment,
        ),
        &[
            ctx.accounts.organization.clone(),
            ctx.accounts.owner.clone(),
        ],
    )?;
    ctx.accounts.election_data.set_inner(input.into());
    ctx.accounts.organization_data.elections_count += 1;
    Ok(())
}

#[derive(Accounts)]
#[instruction(input: ElectionInput)]
pub struct CreateElection<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub organization: AccountInfo<'info>,
    #[account(seeds = [MAIN_SEED], bump)]
    pub main_data: Account<'info, MainData>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, constraint = main_data.owner == owner.key())]
    pub owner: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&organization_seed(organization.key)],
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    #[account(
        init, payer = organization,
        space = 8 + input.anchor_len(),
        seeds = [&election_seed(organization.key, organization_data.elections_count)],
        bump
    )]
    pub election_data: Account<'info, ElectionData>,
    pub system_program: Program<'info, System>,
}
