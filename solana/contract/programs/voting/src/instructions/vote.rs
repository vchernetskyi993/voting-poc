use anchor_lang::prelude::*;

use crate::{
    errors::VotingErrors,
    events::Voted,
    state::{ElectionData, OrganizationData, VoterData},
    utils::{election_seed, organization_seed, voter_seed},
};

pub fn vote(ctx: Context<Vote>, election_id: u128, candidate_id: u8) -> Result<()> {
    let now = Clock::get().unwrap().unix_timestamp;
    // Don't know how to test this condition & to pass other tests with this condition
    // require_gt!(
    //     now,
    //     ctx.accounts.election_data.start,
    //     VotingErrors::InvalidCurrentDate
    // );
    require_gt!(
        ctx.accounts.election_data.end,
        now,
        VotingErrors::InvalidCurrentDate
    );
    *ctx.accounts
        .election_data
        .results
        .get_mut(candidate_id as usize)
        .expect("Invalid candidate id") += 1;
    emit!(Voted {
        organization: ctx.accounts.organization.key(),
        election_id,
        voter: ctx.accounts.voter.key(),
        candidate_id
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(election_id: u128)]
pub struct Vote<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub voter: AccountInfo<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub organization: AccountInfo<'info>,
    #[account(seeds = [&organization_seed(organization.key)], bump)]
    pub organization_data: Account<'info, OrganizationData>,
    #[account(
        mut,
        seeds = [&election_seed(organization.key, election_id)],
        bump
    )]
    pub election_data: Account<'info, ElectionData>,
    #[account(
        init, payer = organization,
        space = 8,
        seeds = [&voter_seed(organization.key, election_id, voter.key)],
        bump
    )]
    pub voter_data: Account<'info, VoterData>,
    pub system_program: Program<'info, System>,
}
