use anchor_lang::prelude::*;

#[event]
pub struct ElectionCreated {
    pub organization: Pubkey,
    pub election_id: u128,
}

#[event]
pub struct Voted {
    pub organization: Pubkey,
    pub election_id: u128,
    pub voter: Pubkey,
    pub candidate_id: u8,
}
