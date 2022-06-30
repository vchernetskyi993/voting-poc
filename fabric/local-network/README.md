# Voting platform network

Uses docker to start all nodes locally. Should serve as an example to deploy on other envs.

## Setup base Voting network

1. Start Certificate Authorities: `docker compose -f docker-compose-ca.yaml up`

<!-- TODO: wrap in Docker container -->
2. Create necessary certs to start nodes: 
```bash
sudo chown -R $USER:$USER data
export PATH=$PATH:~/repo/fabric/fabric-samples/bin/
env $(cat .env | xargs) ./scripts/enroll-gov.sh 
```

3. Start nodes: `docker compose -f docker-compose-nodes.yaml up`

## Cleanup

1. `docker compose -f docker-compose-ca.yaml -f docker-compose-nodes.yaml down`

2. `sudo rm -rf data`

TODO: gov network setup:
* ~~1 CA~~
* ~~1 orderer~~
* ~~1 peer~~
* create elections channel
* deploy contract that just stores text on ledger

TODO: new party setup process:
* 1 CA
* 1 peer
* join elections channel
* receive & test chaincode
