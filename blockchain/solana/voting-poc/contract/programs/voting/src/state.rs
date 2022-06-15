use anchor_lang::prelude::*;

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
    pub results: Vec<u128>,      // 4 + N * 16
}

#[account]
pub struct VoterData {
}

impl From<ElectionInput> for ElectionData {
    fn from(input: ElectionInput) -> Self {
        Self {
            start: input.start,
            end: input.end,
            title: input.title,
            description: input.description,
            candidates: input.candidates.clone(),
            results: vec![0; input.candidates.len()],
        }
    }
}

pub trait AnchorLen {
    fn anchor_len(&self) -> usize;
}

impl AnchorLen for ElectionInput {
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
            + 4
            + self.candidates.len() * 16
    }
}

impl AnchorLen for String {
    fn anchor_len(&self) -> usize {
        4 + self.len()
    }
}
