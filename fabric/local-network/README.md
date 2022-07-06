# Voting platform network

Uses docker to start all nodes locally. Should serve as an example to deploy on other envs.

## Setup base Voting network

We use Python script to generate `docker-compose.yaml` from `Jinja2` template.

1. Install python script requirements: `pip install -r requirements.txt`.
As usual, it's recommended to use virtualenv for this.

2. Start services: `./template.py | docker compose -f - up`

## Add new party

TODO: new party setup process:
* 1 CA
* 1 peer
* join elections channel
* receive & test chaincode
* only government should be able to add new orgs

## Transact using chaincode

After successful network start you can interact with deployed contract.

Set peer.gov variables:
```bash
sudo chown -R $USER:$USER data/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=Government
export CORE_PEER_MSPCONFIGPATH=$PWD/data/gov/admin/msp
export CORE_PEER_ADDRESS=localhost:7051
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/data/gov/peer/tls/tlscacerts/tls-ca-gov-7054.pem
```

Create election:
```bash
peer chaincode invoke \
    -o localhost:7050 \
    --tls \
    --cafile "$PWD/data/gov/orderer/tls/tlscacerts/tls-ca-gov-7054.pem" \
    -C voting \
    -n elections \
    -c '{"function":"CreateElection","Args":["{\"id\":\"0\",\"value\":\"Hello!\"}"]}'
```

Retrieve election with results:
```bash
peer chaincode query \
    -C voting \
    -n elections \
    -c '{"function":"FetchElection","Args":["0"]}'
```

Check if user has already voted:
```bash
peer chaincode query \
    -C voting \
    -n elections \
    -c '{"function":"Voted","Args":["0", "0"]}'
```


## Cleanup

1. Stop and remove containers: `./template.py --all | docker compose -f - down`

2. Remove services persistent data: `sudo rm -rf data`
