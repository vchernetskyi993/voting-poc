# Voting platform network

Uses docker to start all nodes locally. Should serve as an example to deploy on other envs.

## Setup base Voting network

We use Python script to generate `docker-compose.yaml` from `Jinja2` template.

1. Install python script requirements: `pip install -r requirements.txt`.
As usual, it's recommended to use virtualenv for this.

2. Start services: `./template.py | docker compose -f - up`

TODO: gov network setup:
* ~~1 CA~~
* ~~1 orderer~~
* ~~1 peer~~
* create elections channel
* deploy contract that just stores text on ledger

## Add new party

TODO: new party setup process:
* 1 CA
* 1 peer
* join elections channel
* receive & test chaincode

## Cleanup

1. Stop and remove containers: `./template.py --down | docker compose -f - down`

2. Remove services persistent data: `sudo rm -rf data`
