use warp::Filter;

use crate::models::{Election, ListOptions};

pub fn elections() -> impl Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let prefix = warp::path("elections");

    let create_election = warp::post()
        .and(warp::path::end())
        .and(warp::body::json())
        .map(|input: Election| format!("Creating election..."));

    let list_elections = warp::get()
        .and(warp::path::end())
        .and(warp::query())
        .map(|opts: ListOptions| format!("Listing elections..."));

    let fetch_election = warp::get()
        .and(warp::path::param::<u128>())
        .and(warp::path::end())
        .map(|election_id| format!("Retrieving election {}...", election_id));

    prefix.and(create_election.or(list_elections).or(fetch_election))
}
