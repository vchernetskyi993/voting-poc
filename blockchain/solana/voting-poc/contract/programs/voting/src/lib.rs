use anchor_lang::prelude::*;
use sha2::{Digest, Sha256};

declare_id!("7EDCmRd14WTS9gGVJWhypz43wXp9bnkRgW3zxQzeCFMY");

#[program]
pub mod voting {
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

    pub fn create_election(ctx: Context<CreateElection>, input: ElectionData) -> Result<()> {
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
        //TODO: payment 0.1 SOL
        ctx.accounts.election_data.set_inner(input);
        ctx.accounts.organization_data.elections_count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,
    #[account(init, payer = owner, space = 8 + 32, seeds = [b"main_data"], bump)]
    pub main_data: Account<'info, MainData>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(_organization: Pubkey)]
pub struct RegisterOrganization<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub owner: AccountInfo<'info>,
    #[account(seeds = [b"main_data"], bump)]
    pub main_data: Account<'info, MainData>,
    #[account(
        init, payer = owner, space = 8 + 16,
        seeds = [&organization_seed(_organization)],
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    pub system_program: Program<'info, System>,
}

fn organization_seed(organization: Pubkey) -> [u8; 32] {
    return sha256(&format!("organization_data_{}", organization));
}

fn sha256(value: &String) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    let result = hasher.finalize();
    result.as_slice().try_into().expect("Wrong length")
}

#[derive(Accounts)]
#[instruction(input: ElectionData)]
pub struct CreateElection<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub organization: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [&organization_seed(organization.key())],
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    #[account(
        init, payer = organization,
        space = 8 + input.anchor_len(),
        seeds = [&election_seed(organization_data.elections_count)],
        bump
    )]
    pub election_data: Account<'info, ElectionData>,
    pub system_program: Program<'info, System>,
}

fn election_seed(election_id: u128) -> [u8; 32] {
    return sha256(&format!("election_data_{}", election_id));
}

#[error_code]
pub enum VotingErrors {
    #[msg("Only owner is allowed to execute")]
    OnlyOwner,
    #[msg("At least 2 candidates are required")]
    InvalidCandidatesCount,
    #[msg("Start date should be in the future")]
    InvalidStartDate,
    #[msg("End date should be after start")]
    InvalidEndDate,
}

#[account]
pub struct MainData {
    pub owner: Pubkey, // 32
}

#[account]
pub struct OrganizationData {
    pub elections_count: u128, // 16
}

#[account]
pub struct ElectionData {
    start: i64,              // 8
    end: i64,                // 8
    title: String,           // 4 + N
    description: String,     // 4 + N
    candidates: Vec<String>, // 4 + N * (4 + M)
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

#[cfg(test)]
mod tests {
    use super::sha256;

    #[test]
    fn playground() {
        println!("Hash: {:?}", sha256(&"organization_data".to_string()));
    }
}
