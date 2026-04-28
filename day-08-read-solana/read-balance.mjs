import { createSolanaRpc, devnet, address } from "@solana/kit";

// Connect to devnet (Solana's test network)
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));

// Your specific wallet address from Day 1
const targetAddress = address("62H3A3aKN6zRAg4gfRrSbQJ4HMaW15uZQDrn1aP2wbuB");

// Query the balance, just like calling a REST API
const { value: balanceInLamports } = await rpc
  .getBalance(targetAddress)
  .send();

// Lamports are Solana's smallest unit. 1 SOL = 1,000,000,000 lamports.
const balanceInSol = Number(balanceInLamports) / 1_000_000_000;

console.log(`Address: ${targetAddress}`);
console.log(`Balance: ${balanceInSol} SOL`);

