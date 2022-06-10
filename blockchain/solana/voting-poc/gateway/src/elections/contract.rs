use std::{env, rc::Rc};

use anchor_client::{
    solana_sdk::{
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair},
        signer::Signer,
        system_program,
    },
    Client, Cluster, Program,
};

use super::models::{Election, ListOptions, Page};

pub fn create_election(input: &Election) -> u128 {
    let program = program();
    let organization = organization_account();
    let (main_data, _) = Pubkey::find_program_address(&[voting::MAIN_SEED], &program_id());
    let owner = program
        .account::<voting::MainData>(main_data)
        .unwrap()
        .owner;
    let (organization_data, _) = Pubkey::find_program_address(
        &[&voting::organization_seed(&organization.pubkey())],
        &program_id(),
    );
    let election_id = program
        .account::<voting::OrganizationData>(organization_data)
        .unwrap()
        .elections_count;
    let (election_data, _) = Pubkey::find_program_address(
        &[&voting::election_seed(&organization.pubkey(), election_id)],
        &program_id(),
    );

    program
        .request()
        .signer(&organization)
        .accounts(voting::accounts::CreateElection {
            organization: organization.pubkey(),
            main_data,
            owner,
            organization_data,
            election_data,
            system_program: system_program::ID,
        })
        .args(voting::instruction::CreateElection {
            input: input.clone().into(),
        })
        .send()
        .unwrap();

    election_id
}

pub fn list_elections(opts: &ListOptions) -> Page<Election> {
    todo!()
}

pub fn fetch_election(election_id: u128) -> Election {
    todo!()
}

fn program() -> Program {
    let payer = organization_account();
    let cluster = Cluster::Custom(
        env::var("SOLANA_URL").unwrap(),
        env::var("SOLANA_WS_URL").unwrap(),
    );
    let client = Client::new(cluster, Rc::new(payer));

    client.program(program_id())
}

fn program_id() -> Pubkey {
    env::var("ELECTIONS_PROGRAM_ID")
        .unwrap()
        .as_str()
        .try_into()
        .unwrap()
}

fn organization_account() -> Keypair {
    read_keypair_file(env::var("ORG_PRIVATE_KEY_PATH").unwrap()).unwrap()
}

impl Into<voting::ElectionData> for Election {
    fn into(self) -> voting::ElectionData {
        voting::ElectionData {
            start: self.start,
            end: self.end,
            title: self.title.clone(),
            description: self.description.clone(),
            candidates: self.candidates.clone(),
        }
    }
}
