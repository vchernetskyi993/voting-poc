use anchor_client::{ClientError, solana_sdk::pubkey::Pubkey};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct Election {
    pub start: i64,
    pub end: i64,
    pub title: String,
    pub description: String,
    pub candidates: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ElectionId {
    pub id: u128,
}

#[derive(Debug, Deserialize)]
pub struct ListOptions {
    #[serde(rename(serialize = "page"))]
    pub page_number: Option<u128>,
    #[serde(rename(serialize = "pageSize"))]
    pub page_size: Option<u8>,
}

#[derive(Debug, Serialize)]
pub struct Page<T> {
    pub page_number: u128,
    pub page_size: u8,
    pub values: Vec<T>,
    pub elements_count: u128,
    pub page_count: u128,
}

#[derive(Debug, Error)]
pub enum VotingError {
    #[error("Main program data is not initialized")]
    MainPdaNotInitialized,
    #[error("Organization `{0}` not registered")]
    OrganizationNotRegistered(Pubkey),
    #[error("Election `{0}` not found")]
    ElectionNotFound(u128),
    #[error("Unknown error")]
    Unknown(#[from] ClientError),
}

#[derive(Debug, Serialize)]
pub struct ErrorMessage {
    pub error: String,
}
