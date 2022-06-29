# Voting platform network

Uses docker to start all nodes locally. Should serve as an example to deploy on other envs.

1. Start Certificate Authorities: `docker compose -f docker-compose-ca.yaml up`

2. Create necessary certs to start nodes: `./scripts/enroll.sh`

3. Start nodes: `docker compose -f docker-compose-nodes.yaml up`
