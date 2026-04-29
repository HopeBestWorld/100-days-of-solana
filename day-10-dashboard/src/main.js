import {
  createSolanaRpc,
  address,
  lamports,
  devnet
} from "@solana/kit";

// devnet() returns "https://api.devnet.solana.com"
const rpc = createSolanaRpc(devnet());

const addressInput = document.getElementById("addressInput");
const fetchBtn = document.getElementById("fetchBtn");
const resultsDiv = document.getElementById("results");
const errorDiv = document.getElementById("error");
const loadingDiv = document.getElementById("loading");

fetchBtn.addEventListener("click", async () => {
  errorDiv.textContent = "";
  resultsDiv.innerHTML = "";
  loadingDiv.textContent = "Fetching...";

  try {
    // 1. Validate the address
    const targetAddress = address(addressInput.value.trim());

    // 2. Fetch balance
    // The response is a BigInt. We use Number() for UI display.
    const { value: balanceInLamports } = await rpc
      .getBalance(targetAddress)
      .send();

    const balanceInSol = Number(balanceInLamports) / 1_000_000_000;

    // 3. Fetch recent signatures
    const signatures = await rpc
      .getSignaturesForAddress(targetAddress, { limit: 5 })
      .send();

    // Render results
    let html = `<h2>Balance: ${balanceInSol} SOL</h2>`;
    html += `<h3>Recent Transactions</h3>`;

    if (signatures.length === 0) {
      html += `<p>No transactions found.</p>`;
    } else {
      for (const tx of signatures) {
        const time = tx.blockTime
          ? new Date(Number(tx.blockTime) * 1000).toLocaleString()
          : "unknown";

        // In v2, tx.err is null if successful, or an object if failed
        const isSuccess = tx.err === null;
        const statusText = isSuccess ? "Success" : "Failed";

        html += `
          <div class="tx-card">
            <p><strong>Signature:</strong> ${tx.signature}</p>
            <p><strong>Slot:</strong> ${tx.slot}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Status:</strong> ${statusText}</p>
          </div>
          <hr>
        `;
      }
    }

    resultsDiv.innerHTML = html;
  } catch (err) {
    console.error(err);
    errorDiv.textContent = `Error: ${err.message}`;
  } finally {
    loadingDiv.textContent = "";
  }
});