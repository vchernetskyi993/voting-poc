# eVoting POC

![diagram](diagram.png)

To start services locally:

```shell
./start.sh
```

Script does in order:

1. Creates Avalanche 5-node network on admin ports 9650-9658
    * by default uses `~/repo/avalanche-network-runner` path
2. Deploys Elections contract
3. Starts contracts gRPC gateway on port 50051
4. Starts admin back-end on port 8080
5. Starts voter front-end on port 3000

## Troubleshooting

Validate that all apps started:
```shell
nmap -p 3000,8080,9650,9652,9654,9656,9658,50051 127.0.0.1
```

Kill all apps manually:
```shell
fuser -k 3000/tcp 8080/tcp 9650/tcp 9652/tcp 9654/tcp 9656/tcp 9658/tcp 50051/tcp
```
