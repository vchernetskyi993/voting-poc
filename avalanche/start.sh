#!/bin/bash

AVALANCHE_RUNNER_PATH="${HOME}/repo/avalanche-network-runner"

BLUE='\033[0;34m'
NC='\033[0m'

REPO_DIR=$(pwd)
SERVICES_LOG=${REPO_DIR}/$$.log

main() {
    tail -f $SERVICES_LOG & 
    TAIL_PID=$!
    start_avalanche
    deploy_contract
    start_gateway
    start_back_end
    start_front_end
    # FIXME: Ctrl+C works correctly only after this point
    echo -e "\n${BLUE}All services started. Waiting for Ctrl + C...${NC}"
    wait
}

start_avalanche() {
    echo -e "\n${BLUE}[1] Starting local Avalanche network${NC}\n"
    cd $AVALANCHE_RUNNER_PATH
    go run ./examples/local/fivenodenetwork/main.go > $SERVICES_LOG & 
    AVALANCHE_PID=$!
    
    wait_for "All nodes healthy"
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
    ELECTIONS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS npm start > $SERVICES_LOG &
    GATEWAY_PID=$!

    wait_for "Server running"
}

start_back_end() {
    echo -e "\n${BLUE}[4] Starting Admin back-end application${NC}"
    cd $REPO_DIR/admin-back-end
    ./gradlew bootRun > $SERVICES_LOG &
    BACK_END_PID=$!

    wait_for "Started VotingAdminApplicationKt"
}

start_front_end() {
    echo -e "\n${BLUE}[5] Starting Voter front-end application${NC}"
    cd $REPO_DIR/voter-front-end
    npm install
    REACT_APP_ELECTIONS_CONTRACT_ADDRESS=$CONTRACT_ADDRESS npm start > $SERVICES_LOG &
    FRONT_END_PID=$!

    wait_for "No issues found."
}

wait_for() {
    tail -f $SERVICES_LOG | grep -q "$1"
}

shutdown() {
    echo -e "\nShutting down..."
    shutdown_service "$FRONT_END_PID" "Voter Front-end App"
    shutdown_service "$BACK_END_PID" "Admin Back-end App"
    shutdown_service "$GATEWAY_PID" "Gateway"
    shutdown_service "$AVALANCHE_PID" "Avalanche"
    kill $TAIL_PID
    rm $SERVICES_LOG
}

shutdown_service() {
    if [[ ! -z $1 ]]; then
        echo "Shutting down ${2}..."
        kill $1
    fi
}

trap shutdown INT TERM

main
