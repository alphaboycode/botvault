# BotVault

A simple, minimal, and secure full-stack dApp featuring an ERC-4626 vault for native BOT tokens on **BOT Chain Mainnet (Chain ID: 677)** and **BOT Testnet (Chain ID: 968)**. Built with Foundry for smart contracts and Vite + React + TypeScript + viem for the frontend.

---

## Network Information

### BOT Chain Mainnet
- **Network Name:** BOT Chain Mainnet
- **Chain ID:** `677`
- **RPC URL:** `https://rpc.botchain.ai`
- **Native Currency:** BOT (18 decimals, 150 Million Total Supply)
- **Official Website:** [https://www.botchain.ai/en/](https://www.botchain.ai/en/)
- **Block Explorer:** [https://scan.botchain.ai/](https://scan.botchain.ai/)

### BOT Testnet
- **Network Name:** BOT Testnet
- **Chain ID:** `968`
- **RPC URL:** `https://rpc.bohr.life`
- **Native Currency:** BOT (18 decimals)
- **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)

---

## Deployed Smart Contracts

### 1. BOT Chain Mainnet (Chain 677) — LIVE

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **WBOT** (Wrapped BOT) | `0xb884156921A5508f9094a96C0848fad0Bd6c9Ff5` | [View on BOTScan](https://scan.botchain.ai/address/0xb884156921a5508f9094a96c0848fad0bd6c9ff5) |
| **BotVault** (Vault BOT - `vBOT`) | `0x8F17F306F248BF123e1653A845e5079cbBC589D1` | [View on BOTScan](https://scan.botchain.ai/address/0x8f17f306f248bf123e1653a845e5079cbbc589d1) |

#### Mainnet Deployment Transactions
- **WBOT Deployment:** [`0x061a66281d1edb15a50a0044f5efca8654f03b37d523d261997fd10259973908`](https://scan.botchain.ai/tx/0x061a66281d1edb15a50a0044f5efca8654f03b37d523d261997fd10259973908)
- **BotVault Deployment:** [`0xa2972f28e1f4fff51e22675082903dbecb2e04e8c4e9943196572f4a1e718b39`](https://scan.botchain.ai/tx/0xa2972f28e1f4fff51e22675082903dbecb2e04e8c4e9943196572f4a1e718b39)

---

### 2. Proof on BOT Mainnet: Multi-Wallet 24 Transactions

Three test wallets were funded with 0.1 BOT each from `botvault`, and each wallet executed 8 separate transactions interacting with the deployed `BotVault` contract (`depositNative` and `redeemNative`).

#### Wallet Funding Transactions (0.1 BOT each)
1. **Wallet 1 (`0x149f62B205F7E9CBA5889C5F952deCF0e3d3b127`):** [`0xc83bcf93134ae90be3969e0175bc0078797b11015bb99e5aaf0cbe7b8367bc55`](https://scan.botchain.ai/tx/0xc83bcf93134ae90be3969e0175bc0078797b11015bb99e5aaf0cbe7b8367bc55)
2. **Wallet 2 (`0x1de9674806c713De26fb2072fe376249647b12bb`):** [`0xe41d7e89cd8258c4e88f65eb25fbdff09749930dae1e50c4600443436ac5e15c`](https://scan.botchain.ai/tx/0xe41d7e89cd8258c4e88f65eb25fbdff09749930dae1e50c4600443436ac5e15c)
3. **Wallet 3 (`0x19cFea0A65F0EAEe259619709F0A7D8b5B223409`):** [`0xa1d1222fafa7a23d1159165b7c7d948b76ceef8525ea0aaac6629a9a668662e6`](https://scan.botchain.ai/tx/0xa1d1222fafa7a23d1159165b7c7d948b76ceef8525ea0aaac6629a9a668662e6)

#### Wallet 1 Transactions (8 / 8 Completed)
- [Tx 1/8] `depositNative`: [`0x9f7872c707917d8ed4c354ba8a9966313dccf34f98aebbd2c2c53967bf6c2e1f`](https://scan.botchain.ai/tx/0x9f7872c707917d8ed4c354ba8a9966313dccf34f98aebbd2c2c53967bf6c2e1f)
- [Tx 2/8] `depositNative`: [`0x551d4ef0774b189e8c874322feb102a7e8b1f4fda693fc5e8e29393b49a0e18f`](https://scan.botchain.ai/tx/0x551d4ef0774b189e8c874322feb102a7e8b1f4fda693fc5e8e29393b49a0e18f)
- [Tx 3/8] `depositNative`: [`0x89d9ea23773fa63d7d4d23e5d69c6c2ff07666f2461026b01c83b61c411860cb`](https://scan.botchain.ai/tx/0x89d9ea23773fa63d7d4d23e5d69c6c2ff07666f2461026b01c83b61c411860cb)
- [Tx 4/8] `depositNative`: [`0xcb98a044c3bea1bb1ff7c95a788859db35be4ea35406f92ec004352ca9edefdb`](https://scan.botchain.ai/tx/0xcb98a044c3bea1bb1ff7c95a788859db35be4ea35406f92ec004352ca9edefdb)
- [Tx 5/8] `redeemNative`: [`0xa73df6f4bfe15c94e15b915af179c1d728814e005e1fdac57e037e19ba196c77`](https://scan.botchain.ai/tx/0xa73df6f4bfe15c94e15b915af179c1d728814e005e1fdac57e037e19ba196c77)
- [Tx 6/8] `depositNative`: [`0x2ee62982bfa027c5bc977e6bcd263cad1f0d07a2fa205320821256abaa055d28`](https://scan.botchain.ai/tx/0x2ee62982bfa027c5bc977e6bcd263cad1f0d07a2fa205320821256abaa055d28)
- [Tx 7/8] `redeemNative`: [`0x8ee0eae49b53c33ec88dc833a5dac4d601edafb8e8acce7a72ffa3ac3c082332`](https://scan.botchain.ai/tx/0x8ee0eae49b53c33ec88dc833a5dac4d601edafb8e8acce7a72ffa3ac3c082332)
- [Tx 8/8] `depositNative`: [`0xf3a8d9eb8d5571c3b57bb0dcd58a3e9cbb2b9b5ffcc118dd980baf36a90d8cd3`](https://scan.botchain.ai/tx/0xf3a8d9eb8d5571c3b57bb0dcd58a3e9cbb2b9b5ffcc118dd980baf36a90d8cd3)

#### Wallet 2 Transactions (8 / 8 Completed)
- [Tx 1/8] `depositNative`: [`0x924e7a109cd5e822328d90d6f80da87074485984eab8d212478d7fb36a45d91f`](https://scan.botchain.ai/tx/0x924e7a109cd5e822328d90d6f80da87074485984eab8d212478d7fb36a45d91f)
- [Tx 2/8] `depositNative`: [`0xa12590f1d019ac8b9a724b542465ab4f83980932836bff25d580eb2c3b7acc20`](https://scan.botchain.ai/tx/0xa12590f1d019ac8b9a724b542465ab4f83980932836bff25d580eb2c3b7acc20)
- [Tx 3/8] `depositNative`: [`0x618a96c1050e0a14be72d1a0cbc274995b2bd297dd43d1d7eab611489d3cfdbb`](https://scan.botchain.ai/tx/0x618a96c1050e0a14be72d1a0cbc274995b2bd297dd43d1d7eab611489d3cfdbb)
- [Tx 4/8] `depositNative`: [`0x71a6f7c6f0f3b5eb539d657a31e42cfe097c130bad992d660b8283e0a7ecddf9`](https://scan.botchain.ai/tx/0x71a6f7c6f0f3b5eb539d657a31e42cfe097c130bad992d660b8283e0a7ecddf9)
- [Tx 5/8] `redeemNative`: [`0x71c6a2108e42a718b3ed9ef8e66ba59a0b992b214745cb97d75f7ee80b2966a5`](https://scan.botchain.ai/tx/0x71c6a2108e42a718b3ed9ef8e66ba59a0b992b214745cb97d75f7ee80b2966a5)
- [Tx 6/8] `depositNative`: [`0x17e91ad3939b85028274e3ee1b4a94069058a40119e91b8be53d7e97f718579b`](https://scan.botchain.ai/tx/0x17e91ad3939b85028274e3ee1b4a94069058a40119e91b8be53d7e97f718579b)
- [Tx 7/8] `redeemNative`: [`0x8caf24b0a8d07f801f4a34df66537c7405f3ee9c467f8ce299c2b4e922bfc8af`](https://scan.botchain.ai/tx/0x8caf24b0a8d07f801f4a34df66537c7405f3ee9c467f8ce299c2b4e922bfc8af)
- [Tx 8/8] `depositNative`: [`0x35575b690ba7c7254f1f05e426d8672d2b6c4f9d12c73bb1299782bcf8b21d82`](https://scan.botchain.ai/tx/0x35575b690ba7c7254f1f05e426d8672d2b6c4f9d12c73bb1299782bcf8b21d82)

#### Wallet 3 Transactions (8 / 8 Completed)
- [Tx 1/8] `depositNative`: [`0xa89d9421aa04fcc5ff0e6aa7e41b4845601f9c17ca0487bc221d5f30f3934fbf`](https://scan.botchain.ai/tx/0xa89d9421aa04fcc5ff0e6aa7e41b4845601f9c17ca0487bc221d5f30f3934fbf)
- [Tx 2/8] `depositNative`: [`0x286b4397b53e3e6ca35861efa92b3b81339124ac880398173c171cdabb7c151c`](https://scan.botchain.ai/tx/0x286b4397b53e3e6ca35861efa92b3b81339124ac880398173c171cdabb7c151c)
- [Tx 3/8] `depositNative`: [`0x62e4d0f9c432b46cee5e8109123a9361066e2e1501221ae69b56df832a68f2e3`](https://scan.botchain.ai/tx/0x62e4d0f9c432b46cee5e8109123a9361066e2e1501221ae69b56df832a68f2e3)
- [Tx 4/8] `depositNative`: [`0x0dee0a9615a42cdc0902df868ef328f6f38546242f5e22963e460b301a199c53`](https://scan.botchain.ai/tx/0x0dee0a9615a42cdc0902df868ef328f6f38546242f5e22963e460b301a199c53)
- [Tx 5/8] `redeemNative`: [`0xd686af58749291f29a11b0d89ef09c11eb2711c2d5cca1b66579816822cffdf6`](https://scan.botchain.ai/tx/0xd686af58749291f29a11b0d89ef09c11eb2711c2d5cca1b66579816822cffdf6)
- [Tx 6/8] `depositNative`: [`0x10d27fee248d04ab62b38308f6481064e68ceccdff8d80ac35dfb07da4622a92`](https://scan.botchain.ai/tx/0x10d27fee248d04ab62b38308f6481064e68ceccdff8d80ac35dfb07da4622a92)
- [Tx 7/8] `redeemNative`: [`0x0ddc046e99887e91261146b128819baadd99bd4ed90d534393fae113e6d38753`](https://scan.botchain.ai/tx/0x0ddc046e99887e91261146b128819baadd99bd4ed90d534393fae113e6d38753)
- [Tx 8/8] `depositNative`: [`0x94d5ae3c92d77eba9ddd4b6fe721c566cf795934248c89446e1a2d25fc5bed17`](https://scan.botchain.ai/tx/0x94d5ae3c92d77eba9ddd4b6fe721c566cf795934248c89446e1a2d25fc5bed17)

---

### 3. Deployed Contracts (BOT Testnet - Chain 968)

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **WBOT** (Wrapped BOT) | `0x3dE55Ad41C1e13523d5A6Cc29a4794883D4aeF94` | [View on BohrScan](https://scan.bohr.life/address/0x3dE55Ad41C1e13523d5A6Cc29a4794883D4aeF94) |
| **BotVault** (Vault BOT - `vBOT`) | `0xb884156921A5508f9094a96C0848fad0Bd6c9Ff5` | [View on BohrScan](https://scan.bohr.life/address/0xb884156921A5508f9094a96C0848fad0Bd6c9Ff5) |

---

## System Architecture

```text
               +-----------------------------------+
               |               User                |
               +-----------------------------------+
                     |                       ^
         depositNative() (payable)     redeemNative(shares)
                     v                       |
               +-----------------------------------+
               |             BotVault              |
               |      (ERC-4626, OZ 5.x)           |
               |    _decimalsOffset() = 6          |
               |       nonReentrant                |
               +-----------------------------------+
                     |                       ^
             deposit() (wrap)        withdraw() (unwrap)
                     v                       |
               +-----------------------------------+
               |               WBOT                |
               |         (WETH9 Standard)          |
               +-----------------------------------+
```

### 1. `WBOT.sol`
- WETH9-style wrapper contract for native BOT.
- `deposit()`: Mints WBOT 1:1 against deposited native BOT (`msg.value`).
- `withdraw(wad)`: Burns WBOT and transfers native BOT to caller.
- `receive()` & `fallback()`: Automatically wrap incoming native BOT into WBOT.

### 2. `BotVault.sol`
- Inherits OpenZeppelin `ERC4626` (asset: WBOT, name: "Vault BOT", symbol: "vBOT") and `ReentrancyGuard`.
- **Inflation Attack Protection:** Overrides `_decimalsOffset()` to return `6`. Virtual shares and assets prevent share price manipulation and frontrunning donation theft.
- **Reentrancy Protection:** `nonReentrant` modifier on all state-changing entry points: `deposit`, `mint`, `withdraw`, `redeem`, `depositNative`, and `redeemNative`.
- **`depositNative()` payable:**
  - Computes shares with `previewDeposit(msg.value)` **before** wrapping to avoid inflated asset base calculations.
  - Mints shares to `msg.sender` and emits the standard `Deposit` event.
  - Wraps native BOT into WBOT.
- **`redeemNative(shares)`:**
  - Validates `shares <= maxRedeem(msg.sender)`.
  - Computes assets via `previewRedeem(shares)`.
  - Burns caller shares (no token approval needed).
  - Emits the standard `Withdraw` event.
  - Unwraps WBOT and sends native BOT to `msg.sender` (reverting if the transfer fails).
- **`receive()`:** Strict restriction: only accepts native BOT from the WBOT contract (`msg.sender == asset()`).

---

## Project Structure

```text
bot-vault/
  contracts/                 # Foundry project
    src/
      WBOT.sol               # Wrapped BOT contract
      BotVault.sol           # Native BOT ERC-4626 Vault
    test/
      BotVault.t.sol         # Comprehensive unit tests
      invariants/
        BotVaultHandler.sol   # Invariant test action handler
        BotVaultInvariant.t.sol # Invariant fuzz suite
    script/
      Deploy.s.sol           # Foundry deployment script
    foundry.toml             # Foundry configuration with BOT testnet RPC
  frontend/                  # Vite + React + TypeScript + viem frontend
    src/
      contracts/             # Deployed addresses, chain definition & ABIs
        addresses.json
        chain.ts
        BotVault.json
        WBOT.json
        index.ts
      App.tsx                # Single-page dark theme vault dashboard
      App.css                # Minimal clean styling
      main.tsx               # Application entry point
    package.json
    vite.config.ts
  README.md                  # Project documentation
```

---

## Getting Started

### Prerequisites
- [Foundry](https://getfoundry.sh/) (`forge`, `cast`)
- [Node.js](https://nodejs.org/) (v18+ or v20+)
- npm or pnpm

---

## Smart Contracts: Test & Compile

From the `contracts/` directory:

```bash
cd contracts

# Build contracts
forge build

# Run unit tests
forge test

# Run unit and invariant tests with verbosity
forge test -vvv
```

### Test Coverage Highlights
- `test_depositNative_redeemNative_roundTrip()`: Verifies round trip returns exact initial BOT balance.
- `test_erc4626_deposit_redeem_with_wbot()`: Confirms standard ERC-4626 token flow with WBOT.
- `test_multiple_users_proportional_shares()`: Ensures multiple depositors receive exact proportional share accounting.
- `test_redeeming_more_shares_than_owned_reverts()`: Verifies unauthorized/excess redemption attempts revert with `ERC4626ExceededMaxRedeem`.
- `test_depositNative_zero_value()`: Validates zero-value deposit mints 0 shares safely without state corruption.
- `test_inflation_attack_fails()`: Confirms that donating WBOT directly to an empty vault does not steal victim funds due to `_decimalsOffset() = 6`.
- `test_reentrancy_blocked()`: Verifies malicious contracts re-entering from `receive()` during `redeemNative` are stopped by `ReentrancyGuard`.
- `test_receive_rejects_direct_bot_transfer()`: Direct BOT transfers from non-WBOT addresses revert.
- `BotVaultInvariantTest`: Invariant fuzz suite (128,000+ calls) verifying `totalAssets == WBOT.balanceOf(vault)` and no user can redeem more than their share.

---

## Smart Contracts: Deployment

The deployment script `script/Deploy.s.sol` deploys `WBOT` and `BotVault`.

### Deploying to BOT Chain Mainnet (Chain ID 677)
```bash
cd contracts

export KEYSTORE_PASSWORD="<YOUR_KEYSTORE_PASSWORD>"

forge script script/Deploy.s.sol \
  --rpc-url https://rpc.botchain.ai \
  --account botvault \
  --password "$KEYSTORE_PASSWORD" \
  --broadcast
```

### Deploying to BOT Testnet (Chain ID 968)
```bash
cd contracts

export KEYSTORE_PASSWORD="<YOUR_KEYSTORE_PASSWORD>"

forge script script/Deploy.s.sol \
  --rpc-url https://rpc.bohr.life \
  --account botvault \
  --password "$KEYSTORE_PASSWORD" \
  --broadcast
```

---

## Frontend: Setup & Run

From the `frontend/` directory:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will run locally at `http://localhost:5173` (or `http://localhost:5174`).

### Frontend Features
- **Wallet Connection:** Injected Web3 connection (MetaMask, Rabby, etc.) with automatic chain detection and one-click "Switch to BOT Chain Mainnet" / "Add Network" action.
- **Proof on BOT Mainnet Footer:** Contains live verified contract address (`0x8F17F306F248BF123e1653A845e5079cbBC589D1`), Chain ID (`677`), and direct hyperlinks to BOT Chain Website and BOTScan explorer.
- **Live Stats Panel:**
  - Total BOT in vault (`totalAssets`)
  - Share price in BOT per vBOT
  - Total vBOT supply (`totalSupply`)
  - User's vBOT share balance (`formatUnits(..., 24)`)
  - User's BOT equivalent value (`convertToAssets(...)`)
  - User's native wallet BOT & WBOT balances
- **⚡ Native BOT Tab (1-Click Direct Vault):**
  - Instant `depositNative()` with native BOT (auto-wrapped into WBOT, 0 approval transactions).
  - Instant `redeemNative()` with `MAX` button (unwraps WBOT and delivers native BOT).
- **🏦 ERC-4626 Standard Tab (WBOT):**
  - `deposit(assets, receiver)`: Deposit WBOT assets with automatic 1-click allowance approval.
  - `mint(shares, receiver)`: Specify exact vBOT shares to mint.
  - `withdraw(assets, receiver, owner)`: Withdraw exact WBOT assets.
  - `redeem(shares, receiver, owner)`: Burn exact vBOT shares for WBOT.
  - Custom recipient address override support.
- **🔄 Wrap & Yield Simulation Tab:**
  - Independent native BOT <-> WBOT wrapper (`wbot.deposit` and `wbot.withdraw`).
  - **Simulate Vault Yield (Donation):** Transfer WBOT directly to the vault to boost `totalAssets` without increasing share supply, actively pumping the share price for all existing shareholders!
- **🧮 Interactive Calculator Tab:**
  - Live preview testing for `convertToShares` and `convertToAssets` using on-chain vault state.
- **Transaction Tracking:** Real-time feedback for Pending, Success, and Error states with direct explorer links.
