use warp::{reply::json, Filter};

use crate::elections::models::{Election, ListOptions};

use super::{contract, models::ElectionId};

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
        .and_then(fetch_elections);

    prefix.and(create_election.or(list_elections).or(fetch_election))
}

async fn create_election(input: Election) -> Result<impl warp::Reply, warp::Rejection> {
    let id = run_blocking(move || contract::create_election(&input)).await;

    Ok(json(&ElectionId { id }))
}

async fn list_elections(opts: ListOptions) -> Result<impl warp::Reply, warp::Rejection> {
    let page = run_blocking(move || contract::list_elections(&opts)).await;

    Ok(json(&page))
}

async fn fetch_elections(election_id: u128) -> Result<impl warp::Reply, warp::Rejection> {
    let election = run_blocking(move || contract::fetch_election(election_id)).await;

    Ok(json(&election))
}

async fn run_blocking<F, R>(f: F) -> R
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    tokio::task::spawn_blocking(|| f()).await.unwrap()
}
