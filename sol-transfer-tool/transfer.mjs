import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import {
    address,
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    getBase64EncodedWireTransaction, // Added for manual sending
    lamports,
    devnet,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

// --- Configuration ---
const RPC_URL = devnet("https://api.devnet.solana.com");
const LAMPORTS_PER_SOL = 1_000_000_000n;

// --- Helper for UI updates ---
function statusUpdate(message) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(message);
}

const COMMITMENT_LEVELS = ["processed", "confirmed", "finalized"];

// --- Polling Helper for Commitment Stages ---
async function waitForCommitment(rpc, signature, targetCommitment) {
    const targetIndex = COMMITMENT_LEVELS.indexOf(targetCommitment);

    while (true) {
        const { value } = await rpc
            .getSignatureStatuses([signature], { searchTransactionHistory: true })
            .send();

        const status = value[0];

        if (status?.err) {
            throw new Error(`Transaction failed on-chain: ${JSON.stringify(status.err)}`);
        }

        if (status) {
            const currentIndex = COMMITMENT_LEVELS.indexOf(status.confirmationStatus);
            if (currentIndex >= targetIndex) break;
        }

        // INCREASE THIS DELAY to avoid 429 Rate Limit errors
        await new Promise((r) => setTimeout(r, 2500));
    }
}

// --- Staged Transfer Logic ---
async function transferWithConfirmation(rpc, signer, toAddress, amountInSOL) {
    const destination = address(toAddress);
    const transferLamports = lamports(BigInt(Math.round(amountInSOL * 1_000_000_000)));

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(signer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) =>
            appendTransactionMessageInstruction(
                getTransferSolInstruction({
                    source: signer,
                    destination,
                    amount: transferLamports,
                }),
                tx
            )
    );

    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    const signature = getSignatureFromTransaction(signedTransaction);
    const wireTransaction = getBase64EncodedWireTransaction(signedTransaction);

    console.log(`\nSending ${amountInSOL} SOL to ${toAddress}...\n`);

    // Step A: Send the transaction
    statusUpdate("Status: Sending transaction...");
    await rpc.sendTransaction(wireTransaction, { encoding: "base64" }).send();

    statusUpdate("Status: Processed (included in a block)...");

    // Step B: Wait for confirmed status
    await waitForCommitment(rpc, signature, "confirmed");
    statusUpdate("Status: Confirmed (supermajority voted)...");

    // Step C: Wait for finalized status
    await waitForCommitment(rpc, signature, "finalized");
    statusUpdate("Status: Finalized (irreversible)");

    console.log("\n");

    return signature;
}

// --- Load Keypair Logic ---
async function loadKeypair() {
    const keypairPath = resolve(homedir(), ".config", "solana", "id.json");
    const secretKeyJson = await readFile(keypairPath, "utf-8");
    const secretKeyBytes = new Uint8Array(JSON.parse(secretKeyJson));
    return await createKeyPairSignerFromBytes(secretKeyBytes);
}

// --- Main function ---
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node transfer.mjs <RECIPIENT_ADDRESS> <AMOUNT_IN_SOL>");
        process.exit(1);
    }

    const recipientAddress = address(args[0]);
    const solAmount = parseFloat(args[1]);

    const rpc = createSolanaRpc(RPC_URL);
    const sender = await loadKeypair();

    try {
        const signature = await transferWithConfirmation(rpc, sender, recipientAddress, solAmount);

        console.log("Transaction successful!");
        console.log(`Signature: ${signature}`);
        console.log(`View on Solana Explorer:`);
        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);

        // Updated balance check
        const { value: newBalance } = await rpc.getBalance(sender.address).send();
        console.log(`\nNew balance: ${Number(newBalance) / Number(LAMPORTS_PER_SOL)} SOL`);
    } catch (error) {
        console.error("\nTransaction failed:");
        console.error(error.message);
        process.exit(1);
    }
}

main().catch(console.error);