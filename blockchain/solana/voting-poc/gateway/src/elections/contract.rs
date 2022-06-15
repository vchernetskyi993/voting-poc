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

pub struct VotingContract {
    program: Program,
    main_data: Pubkey,
    owner: Pubkey,
    organization: Keypair,
    organization_data: Pubkey,
}

impl VotingContract {
    pub fn new() -> Self {
        let program_id = program_id();
        let program = program();
        let main_data = Pubkey::find_program_address(&[voting::MAIN_SEED], &program_id).0;
        let owner = program
            .account::<voting::MainData>(main_data)
            .unwrap()
            .owner;
        let organization = organization_account();
        let organization_data = organization_pda(&organization.pubkey());
        Self {
            program,
            main_data,
            owner,
            organization,
            organization_data,
        }
    }

    pub fn create_election(&self, input: &Election) -> Result<u128, VotingError> {
        let election_id = self.elections_count()?;
        let election_data = self.election_pda(election_id);

        self.program
            .request()
            .signer(&self.organization)
            .accounts(voting::accounts::CreateElection {
                organization: self.organization.pubkey(),
                main_data: self.main_data,
                owner: self.owner,
                organization_data: self.organization_data,
                election_data,
                system_program: system_program::ID,
            })
            .args(voting::instruction::CreateElection {
                input: input.clone().into(),
            })
            .send()
            .map_err(|err| VotingError::Unknown(err))?;

        Ok(election_id)
    }

    pub fn list_elections(&self, opts: &ListOptions) -> Result<Page<Election>, VotingError> {
        let page_number = opts.page_number.unwrap_or(1);
        let expected_size: u128 = opts.page_size.unwrap_or(10) as u128;
        let elements_count = self.elections_count()?;
        let page_count: u128 = elements_count / expected_size
            + (if elements_count % expected_size == 0 {
                0
            } else {
                1
            });
        let start = expected_size * (page_number - 1);
        let actual_size = if page_count == page_number {
            elements_count % expected_size
        } else {
            expected_size
        };
        let values = (start..(start + actual_size))
            .map(|id| self.fetch_election(id))
            .filter(|r| r.is_ok())
            .map(|r| r.unwrap())
            .collect();

        Ok(Page {
            page_number,
            page_size: actual_size.try_into().unwrap(),
            values,
            elements_count,
            page_count,
        })
    }

    pub fn fetch_election(&self, election_id: u128) -> Result<Election, VotingError> {
        let election_data = self.election_pda(election_id);

        self.program
            .account::<voting::ElectionData>(election_data)
            .map(Election::from)
            .map_err(|err| match err {
                ClientError::AccountNotFound => VotingError::ElectionNotFound(election_id),
                _ => VotingError::Unknown(err),
            })
    }

    fn elections_count(&self) -> Result<u128, VotingError> {
        Ok(self.program
            .account::<voting::OrganizationData>(self.organization_data)
            .map_err(|err| match err {
                ClientError::AccountNotFound => {
                    VotingError::OrganizationNotRegistered(self.organization.pubkey())
                }
                _ => VotingError::Unknown(err),
            })?
            .elections_count)
    }

    fn election_pda(&self, election_id: u128) -> Pubkey {
        Pubkey::find_program_address(
            &[&voting::election_seed(&self.organization.pubkey(), election_id)],
            &program_id(),
        )
        .0
    }
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

fn organization_pda(organization: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[&voting::organization_seed(organization)], &program_id()).0
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
