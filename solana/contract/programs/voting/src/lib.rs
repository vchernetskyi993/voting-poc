use anchor_lang::prelude::*;

use crate::instructions::*;
use crate::state::ElectionInput;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

declare_id!("4JA7SFWdpchJETv26nhLCpWYYd5yoMG3Xy6zL8wMP6DL");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize(ctx)
    }

    pub fn register_organization(
        ctx: Context<RegisterOrganization>,
        organization: Pubkey,
    ) -> Result<()> {
        instructions::register_organization(ctx, organization)
    }

    pub fn create_election(ctx: Context<CreateElection>, input: ElectionInput) -> Result<()> {
        instructions::create_election(ctx, input)
    }

    pub fn vote(ctx: Context<Vote>, election_id: u128, candidate_id: u8) -> Result<()> {
        instructions::vote(ctx, election_id, candidate_id)
    }
}