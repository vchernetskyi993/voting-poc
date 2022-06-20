use std::env;

use rand::{distributions::Alphanumeric, Rng};
use warp::Filter;

mod elections;

#[tokio::main]
async fn main() {
    dotenv::dotenv().unwrap();
    tracing_subscriber::fmt().init();

    let port = env::var("SERVER_PORT").unwrap().parse::<u16>().unwrap();
    warp::serve(elections::routes().with(warp::trace(|info| {
        tracing::info_span!(
            "request",
            method=?info.method(),
            path=?info.path(),
            id=?trace_id()
        )
    })))
    .run(([127, 0, 0, 1], port))
    .await;
}

fn trace_id() -> String {
    rand::thread_rng()
        .sample_iter(Alphanumeric)
        .take(16)
        .map(char::from)
        .collect()
}
