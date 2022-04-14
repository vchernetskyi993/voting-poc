#!/bin/bash

AVALANCHE_RUNNER_PATH="${HOME}/repo/avalanche-network-runner"

BLUE='\033[0;34m'
NC='\033[0m'

REPO_DIR=$(pwd)

main() {
    start_avalanche
    deploy_contract
    start_gateway
    start_back_end
    start_front_end
    echo -e "\n${BLUE}All services started. Waiting for Ctrl + C...${NC}"
    wait
}

start_avalanche() {
    echo -e "\n${BLUE}[1] Starting local Avalanche network${NC}\n"
    cd $AVALANCHE_RUNNER_PATH
    wait_for "All nodes healthy" < <(go run ./examples/local/fivenodenetwork/main.go)
}

deploy_contract() {
    echo -e "\n${BLUE}[2] Deploying Elections contract${NC}"
    cd $REPO_DIR/contracts
    npm install
    DEPLOYMENT_RESULT="$(npx hardhat run --network avalancheLocal scripts/01_deploy_elections.ts)"
    echo "${DEPLOYMENT_RESULT}"
    CONTRACT_ADDRESS=$(echo $DEPLOYMENT_RESULT | awk '{print $NF}')
}

start_gateway() {
    echo -e "\n${BLUE}[3] Starting gRPC Gateway${NC}"
    cd $REPO_DIR/contracts-gateway
    npm install
    wait_for "Server running" < <(ELECTIONS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS npm start)
}

start_back_end() {
    echo -e "\n${BLUE}[4] Starting Admin back-end application${NC}"
    cd $REPO_DIR/admin-back-end
    wait_for "Started VotingAdminApplicationKt" < <(./gradlew bootRun)
}

start_front_end() {
    echo -e "\n${BLUE}[5] Starting Voter front-end application${NC}"
    cd $REPO_DIR/voter-front-end
    npm install
    wait_for "No issues found." < <(REACT_APP_ELECTIONS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS npm start)
}

wait_for() {
    while read -r line; do
        echo "${line}"
        if [[ $line == *"$1"* ]]; then
            break
        fi
    done
}

main
