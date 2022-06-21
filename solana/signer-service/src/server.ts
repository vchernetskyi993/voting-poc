import express, { Express, Router } from "express";
import { Transaction } from "@solana/web3.js";
import { keypair } from "./utils";

type Base64Transaction = {
  tx: string;
};

export function server(secretPath: string, clientUrl: string): Express {
  return express()
    .use(express.json())
    .use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", clientUrl);
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      next();
    })
    .use(signRoute(secretPath));
}

function signRoute(secretPath: string): Router {
  return Router().post("/sign", (req, res, next) => {
    const input = req.body as Base64Transaction;
    const tx = Transaction.from(Buffer.from(input.tx, "base64"));
    keypair(secretPath)
      .then((key) => {
        tx.partialSign(key);
        res.send({
          tx: tx.serialize({ requireAllSignatures: false }).toString("base64"),
        });
      })
      .catch(next);
  });
}
