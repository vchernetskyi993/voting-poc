use anchor_lang::prelude::Pubkey;
use sha2::{Sha256, Digest};


pub const MAIN_SEED: &[u8; 9] = b"main_data";

pub fn election_seed(organization: &Pubkey, election_id: u128) -> [u8; 32] {
    return sha256(&format!("{}_election_data_{}", organization, election_id));
}

pub fn organization_seed(organization: &Pubkey) -> [u8; 32] {
    return sha256(&format!("organization_data_{}", organization));
}

fn sha256(value: &String) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(value.as_bytes());
    let result = hasher.finalize();
    result.as_slice().try_into().expect("Wrong length")
}
