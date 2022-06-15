use crate::*;
use anchor_lang::prelude::*;

#[program]
pub mod voting {
    use anchor_lang::solana_program::{self, native_token::sol_to_lamports};

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.main_data.owner = ctx.accounts.owner.key();
        Ok(())
    }

    pub fn register_organization(
        ctx: Context<RegisterOrganization>,
        _organization: Pubkey,
    ) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.owner.key(),
            ctx.accounts.main_data.owner,
            VotingErrors::OnlyOwner
        );
        ctx.accounts.organization_data.elections_count = 0;
        Ok(())
    }

    pub fn create_election(ctx: Context<CreateElection>, input: ElectionInput) -> Result<()> {
        require_gt!(
            input.candidates.len(),
            1,
            VotingErrors::InvalidCandidatesCount
        );
        require_gt!(
            input.start,
            Clock::get().unwrap().unix_timestamp,
            VotingErrors::InvalidStartDate
        );
        require_gt!(input.end, input.start, VotingErrors::InvalidEndDate);
        let payment = sol_to_lamports(0.01);
        if ctx.accounts.organization.try_lamports()? < payment {
            return err!(VotingErrors::InsufficientFundsToCreateElection);
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

    pub fn vote(_ctx: Context<CreateElection>, _candidate_id: u8) -> Result<()> {
        // TODO: store vote
        // TODO: validate voting in progress
        // TODO: validate vote uniqueness
        // TODO: validate vote uniqueness
        // TODO: produce event on each successful vote
        // TODO: make free for users
        Ok(())
    }
}
