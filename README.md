# 100 Days of Solana

## Solana Accounts vs. Traditional Databases

| Concept | Traditional Database | Solana Accounts |
| :--- | :--- | :--- |
| **Data location** | Rows in tables on a centralized server | Accounts on a distributed ledger across validators |
| **Schema** | Defined by DB (SQL DDL, document schema) | Defined by owning program; stored as raw bytes |
| **Access control** | Application-level auth (SQL roles, middleware) | Runtime-enforced: only owner program can modify |
| **Cost of storage** | Server/cloud hosting fees, pay for disk space | Rent-exempt deposit (refundable upon closing) |
| **Identity/keys** | Auto-increment IDs, UUIDs | 32-byte public keys or PDAs |
| **Reads** | SQL queries, document lookups | RPC calls (`getAccountInfo`, `getProgramAccounts`) |
| **Writes** | INSERT/UPDATE via application code | Transactions with instructions + authorized signers |
| **Code vs Data** | Application code and DB are separate | Both are accounts (Programs vs. Data accounts) |
| **Deletion** | DELETE query removes the row | Close account; lamports returned to you |
| **Visibility** | Private by default; you choose what to expose | Public by default; anyone can read any account |