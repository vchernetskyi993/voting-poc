use std::{env, rc::Rc};

use anchor_client::{
    solana_sdk::{
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair},
        signer::Signer,
        system_program,
    },
    Client, ClientError, Cluster, Program,
};

use super::models::{Election, ListOptions, Page, VotingError};

pub fn create_election(input: &Election) -> Result<u128, VotingError> {
    let program = program();
    let organization = organization_account();
    let (main_data, _) = Pubkey::find_program_address(&[voting::MAIN_SEED], &program_id());
    let owner = program
        .account::<voting::MainData>(main_data)
        .map_err(|err| match err {
            ClientError::AccountNotFound => VotingError::MainPdaNotInitialized,
            _ => VotingError::Unknown(err),
        })?
        .owner;
    let (organization_data, _) = Pubkey::find_program_address(
        &[&voting::organization_seed(&organization.pubkey())],
        &program_id(),
    );
    let election_id = program
        .account::<voting::OrganizationData>(organization_data)
        .map_err(|err| match err {
            ClientError::AccountNotFound => {
                VotingError::OrganizationNotRegistered(organization.pubkey())
            }
            _ => VotingError::Unknown(err),
        })?
        .elections_count;
    let election_data = election_pda(&organization.pubkey(), election_id);

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
        .send().map_err(|err| VotingError::Unknown(err))?;

    Ok(election_id)
}

pub fn list_elections(opts: &ListOptions) -> Page<Election> {
    let page_number = opts.page_number.unwrap_or(1);
    let page_size = opts.page_size.unwrap_or(10);

    Page {
        page_number,
        page_size,
        values: todo!(),
        elements_count: todo!(),
        page_count: todo!(),
    }
}

pub fn fetch_election(election_id: u128) -> Result<Election, VotingError> {
    let program = program();
    let organization = organization_account();
    let election_data = election_pda(&organization.pubkey(), election_id);

    program
        .account::<voting::ElectionData>(election_data)
        .map(Election::from)
        .map_err(|err| match err {
            ClientError::AccountNotFound => VotingError::ElectionNotFound(election_id),
            _ => VotingError::Unknown(err),
        })
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

fn election_pda(organization: &Pubkey, election_id: u128) -> Pubkey {
    Pubkey::find_program_address(
        &[&voting::election_seed(organization, election_id)],
        &program_id(),
    )
    .0
}

impl Into<voting::ElectionInput> for Election {
    fn into(self) -> voting::ElectionInput {
        voting::ElectionInput {
            start: self.start,
            end: self.end,
            title: self.title.clone(),
            description: self.description.clone(),
            candidates: self.candidates.clone(),
        }
    }
}

impl From<voting::ElectionData> for Election {
    fn from(data: voting::ElectionData) -> Self {
        Self {
            start: data.start,
            end: data.end,
            title: data.title,
            description: data.description,
            candidates: data.candidates,
        }
    }
}
