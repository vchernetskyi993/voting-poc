use anyhow::Result;
use std::env;

use routes::elections;

mod routes;
mod models;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().unwrap();

    let port = env::var("SERVER_PORT")?.parse::<u16>()?;
    warp::serve(elections()).run(([127, 0, 0, 1], port)).await;
    Ok(())
}
