use warp::{
    hyper::StatusCode,
    reply::{json, Json},
    Filter, Reply,
};

use crate::elections::models::{Election, ListOptions};

use super::{
    contract,
    models::{ElectionId, ErrorMessage, VotingError},
};

pub fn elections() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let prefix = warp::path("elections");

    let create_election = warp::post()
        .and(warp::path::end())
        .and(warp::body::json())
        .and_then(create_election);

    let list_elections = warp::get()
        .and(warp::path::end())
        .and(warp::query())
        .and_then(list_elections);

    let fetch_election = warp::get()
        .and(warp::path::param::<u128>())
        .and(warp::path::end())
        .and_then(fetch_election);

    prefix.and(create_election.or(list_elections).or(fetch_election))
}

async fn create_election(input: Election) -> Result<warp::reply::Response, warp::Rejection> {
    let result = run_blocking(move || contract::create_election(&input)).await;
    
    match result {
        Ok(id) => Ok(json(&ElectionId { id }).into_response()),
        Err(error) => {
            Ok(error.to_response())
        }
    }
}

async fn list_elections(opts: ListOptions) -> Result<impl warp::Reply, warp::Rejection> {
    let page = run_blocking(move || contract::list_elections(&opts)).await;

    Ok(json(&page))
}

async fn fetch_election(election_id: u128) -> Result<warp::reply::Response, warp::Rejection> {
    let result = run_blocking(move || contract::fetch_election(election_id)).await;

    match result {
        Ok(election) => Ok(json(&election).into_response()),
        Err(error) => {
            Ok(error.to_response())
        }
    }
}

impl VotingError {
    fn to_response(&self) -> warp::reply::Response {
        warp::reply::with_status(self.to_json(), self.to_http_status()).into_response()
    }

    fn to_http_status(&self) -> StatusCode {
        match self {
            VotingError::MainPdaNotInitialized => StatusCode::BAD_REQUEST,
            VotingError::OrganizationNotRegistered(key) => StatusCode::BAD_REQUEST,
            VotingError::ElectionNotFound(_) => StatusCode::NOT_FOUND,
            VotingError::Unknown(err) => {
                tracing::error!("Error: {}", err);
                StatusCode::INTERNAL_SERVER_ERROR
            }
        }
    }

    fn to_json(&self) -> Json {
        json(&ErrorMessage {
            error: self.to_string(),
        })
    }
}

async fn run_blocking<F, R>(f: F) -> R
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    tokio::task::spawn_blocking(|| f()).await.unwrap()
}
