# Solana Token Extensions Configuration & State Analysis

An on-chain comparison of three distinct token configurations deployed to Solana Devnet using the Token-2022 program (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`). This documentation analyzes how varying feature sets impact account layout size, rent parameters, and administrative governance models.

## Extension Matrix & Cost Comparison

| Mint Address | Configuration Profile | Account Data Size | Lamports Deposited | Rent Fee (SOL) | Active Governance Roles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `BX42hQwSpKreSckUR3XRN9EHXWKz6kJvZgaojkRH11dH` | Interest-Bearing Token | 222 Bytes | 2,436,000 | 0.00243600 SOL | Mint Authority<br>Rate Authority |
| `2hnpXwGWNk2YpTWaU3wF5YsgGpiYBY1NJsPeshL5EbYY` | Multi-Extension (Branded Asset) | 599 Bytes | 5,059,920 | 0.00505992 SOL | Mint Authority<br>Rate Authority<br>Fee Config Authority<br>Withdrawal Authority<br>Metadata Update Authority |
| `6DyYHa2ZXTNdpnEoRWAtERbRPmmvDhVgeLbhgGWwxXTE` | Compliance-Gated Token | 171 Bytes | 2,081,040 | 0.00208104 SOL | Mint Authority<br>Freeze Authority |

---

## Detailed On-Chain Configurations

### 1. Interest-Bearing Token (`BX42hQ...11dH`)
* **Core Specs:** 9 Decimals
* **Active Extensions:** `Interest-bearing`
* **Current Rate Configuration:** `15000 bps` (150% Annual Compound Rate)
* **Governance Layout:** Wallet `5bsSMz6oc4gHp5BkBFSR9HK4mn7NBTimvsgSL9soXktj` retains exclusive signing rights over both mint supply issuance and interest-rate updates.

### 2. Multi-Extension Asset (`2hnpXw...EbYY`)
* **Core Specs:** 2 Decimals (Fiat-style fractional layout)
* **Active Extensions:** `Interest-bearing`, `Transfer fees`, `Metadata Pointer`, `Metadata`
* **Feature Settings:**
  * **Interest Rate:** `5 bps` (0.05% Baseline Yield)
  * **Transfer Fee:** `100 bps` (1.00% tax per peer-to-peer execution) capped at a maximum transaction deduction threshold of `5.00 ARC` tokens (`500` base units).
  * **On-Chain Metadata:** Points locally to itself via structural type-length-value bindings containing standard cryptographic symbols (`ARC`), asset names (`ArcCoin`), and pointer pathways to off-chain assets hosted via GitHub.
* **Governance Layout:** Monolithic authorization structure managed directly by the `5bsSMz...Xktj` keypair across all administrative channels.

### 3. Compliance-Gated Asset (`6DyYHa...XTE`)
* **Core Specs:** 9 Decimals
* **Active Extensions:** `DefaultAccountState`
* **Feature Settings:** System default configuration forces every freshly instantiated Associated Token Account (ATA) into a locked state (`Frozen`). 
* **Governance Layout:** Requires a signature from the Freeze Authority (`5bsSMz...Xktj`) via protocol-level `thaw` processing instructions before balances can settle or change ownership.

---

## Technical Insights: TLV Structural Layouts

The variations in storage overhead observed above highlight the mechanics of the Token-2022 program's **Type-Length-Value (TLV)** layout model:

1. **The Base Allocation Baseline:** A native legacy SPL token mint utilizes a fixed allocation model capping the physical structure size at an immutable **165 bytes**.
2. **Sequential Extensions Buffer:** Token-2022 maps additional logic configurations sequentially within an open buffer appended to the base allocation. Each flag uses a 4-byte padding preamble (2 bytes tracking Type indicators, 2 bytes verifying length configurations) followed by raw byte variables.
3. **Variable-Length Overhead:** The dramatic expansion of the Multi-Extension Token (`599 bytes`) is caused by storing variable-length string arrays (the name string, tickers, and token metadata URI) directly in the mint account's storage. On Solana, larger storage allocations scale rent costs proportionally, mapping structural architectural choices directly onto on-chain operational costs.