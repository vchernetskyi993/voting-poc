import "./config";
import { electionsContract } from "./elections/contract";
import { electionsServer } from "./elections/grpc";
import { startServer } from "./server";

startServer(electionsServer(electionsContract())).catch((err) =>
  console.error(err)
);
