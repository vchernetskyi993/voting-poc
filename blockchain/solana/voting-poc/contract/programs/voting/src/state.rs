use anchor_lang::prelude::*;

use crate::utils::{election_seed, organization_seed, MAIN_SEED};

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,
    #[account(init, payer = owner, space = 8 + 32, seeds = [MAIN_SEED], bump)]
    pub main_data: Account<'info, MainData>,
    pub system_program: Program<'info, System>,
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

#[derive(Accounts)]
#[instruction(input: ElectionData)]
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

#[account]
pub struct MainData {
    pub owner: Pubkey, // 32
}

#[account]
pub struct OrganizationData {
    pub elections_count: u128, // 16
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ElectionInput {
    pub start: i64,
    pub end: i64,
    pub title: String,
    pub description: String,
    pub candidates: Vec<String>,
}

#[account]
pub struct ElectionData {
    pub start: i64,              // 8
    pub end: i64,                // 8
    pub title: String,           // 4 + N
    pub description: String,     // 4 + N
    pub candidates: Vec<String>, // 4 + N * (4 + M)
}

impl From<ElectionInput> for ElectionData {
    fn from(input: ElectionInput) -> Self {
        Self {
            start: input.start,
            end: input.end,
            title: input.title,
            description: input.description,
            candidates: input.candidates,
        }
    }
}

trait AnchorLen {
    fn anchor_len(&self) -> usize;
}

impl AnchorLen for ElectionData {
    fn anchor_len(&self) -> usize {
        8 + 8
            + self.title.anchor_len()
            + self.description.anchor_len()
            + 4
            + self
                .candidates
                .iter()
                .map(|candidate| candidate.anchor_len())
                .sum::<usize>()
    }
}

impl AnchorLen for String {
    fn anchor_len(&self) -> usize {
        4 + self.len()
    }
}
