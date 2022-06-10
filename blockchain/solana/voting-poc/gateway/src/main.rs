use std::env;

mod elections;

#[tokio::main]
async fn main() {
    dotenv::dotenv().unwrap();

    let port = env::var("SERVER_PORT").unwrap().parse::<u16>().unwrap();
    warp::serve(elections::routes()).run(([127, 0, 0, 1], port)).await;
}
