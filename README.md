# BotVault

A simple, minimal, and secure full-stack dApp featuring an ERC-4626 vault for native BOT tokens on the BOT Testnet. Built with Foundry for smart contracts and Vite + React + TypeScript + viem for the frontend.

---

## Network Information

- **Network Name:** BOT Testnet
- **Chain ID:** `968`
- **RPC URL:** `https://rpc.bohr.life`
- **Native Currency:** BOT (18 decimals)
- **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)

---

## Deployed Contracts (BOT Testnet)

Both contracts are deployed and verified on the BOT Testnet explorer:

| Contract | Address | Explorer Link |
| :--- | :--- | :--- |
| **WBOT** (Wrapped BOT) | `0x3dE55Ad41C1e13523d5A6Cc29a4794883D4aeF94` | [View on BohrScan](https://scan.bohr.life/address/0x3dE55Ad41C1e13523d5A6Cc29a4794883D4aeF94) |
| **BotVault** (Vault BOT - `vBOT`) | `0xb884156921A5508f9094a96C0848fad0Bd6c9Ff5` | [View on BohrScan](https://scan.bohr.life/address/0xb884156921A5508f9094a96C0848fad0Bd6c9Ff5) |

### Deployment Transaction Hashes
- **WBOT Deployment:** [`0xfdd2e283b60aac9157e8034e1cfafe16e32d73282eb865bcae35bea2985f011c`](https://scan.bohr.life/tx/0xfdd2e283b60aac9157e8034e1cfafe16e32d73282eb865bcae35bea2985f011c)
- **BotVault Deployment:** [`0xac599b37e04e3c5ba9feb6d67987b71f44e5dd42e2a99093a117670c1c867c82`](https://scan.bohr.life/tx/0xac599b37e04e3c5ba9feb6d67987b71f44e5dd42e2a99093a117670c1c867c82)

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

To deploy using an existing cast keystore (e.g. `botvault`):

```bash
cd contracts

# Provide password via environment variable or git-ignored password file
export KEYSTORE_PASSWORD="<YOUR_KEYSTORE_PASSWORD>"

# Broadcast deployment to BOT Testnet
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
- **Wallet Connection:** Injected Web3 connection (MetaMask, Rabby, etc.) with automatic chain detection and one-click "Switch to BOT Testnet" / "Add Network" action.
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
- **Transaction Tracking:** Real-time feedback for Pending, Success, and Error states with direct BohrScan explorer links.
