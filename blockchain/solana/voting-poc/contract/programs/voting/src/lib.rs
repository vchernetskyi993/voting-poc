use anchor_lang::prelude::*;

declare_id!("34jePpDQgnfeJkADMwDTKoCjR9pRtcDS6MMqzdkhXkzT");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
