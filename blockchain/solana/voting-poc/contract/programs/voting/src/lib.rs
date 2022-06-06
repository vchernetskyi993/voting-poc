use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};

declare_id!("34jePpDQgnfeJkADMwDTKoCjR9pRtcDS6MMqzdkhXkzT");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.main_data.owner = ctx.accounts.owner.key();
        Ok(())
    }

    pub fn register_organization(ctx: Context<RegisterOrganization>, _organization: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.owner.key(), ctx.accounts.main_data.owner);
        ctx.accounts.organization_data.elections_count = 0;
        Ok(())
    }

    pub fn create_election(ctx: Context<CreateElection>, input: ElectionData) -> Result<()> {
        //TODO: validations:
        //    * candidates length
        //    * start in the future
        //    * end after start
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
    #[account(init, payer = owner, space = 8, seeds = [b"main_data"], bump)]
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
        seeds = [&sha256(&format!("organization_data_{}", _organization))], 
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    pub system_program: Program<'info, System>,
}

fn sha256(value: &String) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    let result = hasher.finalize();
    result.as_slice().try_into().expect("Wrong length")
}

#[derive(Accounts)]
pub struct CreateElection<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub organization: AccountInfo<'info>,
    #[account(mut, seeds = [b"main_data"], bump)]
    pub main_data: Account<'info, MainData>,
    #[account(
        seeds = [format!("organization_data_{}", organization.key).as_bytes()], 
        bump
    )]
    pub organization_data: Account<'info, OrganizationData>,
    #[account(
        init, payer = organization, space = 8, 
        seeds = [format!("election_data_{}", organization_data.elections_count).as_bytes()], 
        bump
    )]
    pub election_data: Account<'info, ElectionData>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct MainData {
    pub owner: Pubkey,
}

#[account]
pub struct OrganizationData {
    pub elections_count: u128, // 16
}

#[account]
pub struct ElectionData {
    start: i64,
    end: i64,
    title: String,
    description: String,
    candidates: Vec<String>,
}

#[cfg(test)]
mod tests {
    use super::sha256;

    #[test]
    fn playground() {
        println!("Hash: {:?}", sha256(&"organization_data".to_string()));
    }
}
