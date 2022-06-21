import { Keypair } from "@solana/web3.js";
import fs from "fs/promises";

export function env(key: string): string {
  const value = process.env[key];
  if (value) {
    return value;
  }
  throw Error(`${key} environment variable is required.`);
}

export async function keypair(secret: string): Promise<Keypair> {
  return fs
    .readFile(secret, "ascii")
    .then(JSON.parse)
    .then((arr) => Uint8Array.from(arr))
    .then(Keypair.fromSecretKey);
}
