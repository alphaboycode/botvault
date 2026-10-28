import React, { useState, useEffect, useCallback } from 'react';
import {
  createWalletClient,
  custom,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  type Address,
} from 'viem';
import {
  botTestnet,
  addresses,
  botVaultAbi,
  publicClient,
  VAULT_DECIMALS,
} from './contracts';
import './App.css';

interface TxState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  message?: string;
}

export const App: React.FC = () => {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Vault data
  const [totalAssets, setTotalAssets] = useState<bigint>(0n);
  const [sharePrice, setSharePrice] = useState<string>('1.000000');
  const [userVBotBalance, setUserVBotBalance] = useState<bigint>(0n);
  const [userBotValue, setUserBotValue] = useState<bigint>(0n);
  const [userNativeBalance, setUserNativeBalance] = useState<bigint>(0n);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Inputs
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isTransacting, setIsTransacting] = useState(false);

  // Status message
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

  const isWrongChain = chainId !== null && chainId !== botTestnet.id;

  // Initialize wallet connection if already authorized
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts: unknown) => {
          const accs = accounts as string[];
          if (accs && accs.length > 0) {
            setAccount(accs[0] as Address);
          }
        })
        .catch(console.error);

      window.ethereum
        .request({ method: 'eth_chainId' })
        .then((id: unknown) => {
          setChainId(parseInt(id as string, 16));
        })
        .catch(console.error);

      const handleAccountsChanged = (accs: unknown) => {
        const accounts = accs as string[];
        if (accounts.length > 0) {
          setAccount(accounts[0] as Address);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (id: unknown) => {
        setChainId(parseInt(id as string, 16));
      };

      window.ethereum.on?.('accountsChanged', handleAccountsChanged);
      window.ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Connect wallet handler
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet to connect.');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0] as Address);
      }
      const currentChainId = (await window.ethereum.request({
        method: 'eth_chainId',
      })) as string;
      setChainId(parseInt(currentChainId, 16));
    } catch (err: unknown) {
      console.error(err);
      const error = err as { message?: string };
      setTxState({
        status: 'error',
        message: error.message || 'Failed to connect wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Switch or Add BOT Testnet
  const switchNetwork = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${botTestnet.id.toString(16)}` }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${botTestnet.id.toString(16)}`,
                chainName: botTestnet.name,
                nativeCurrency: botTestnet.nativeCurrency,
                rpcUrls: botTestnet.rpcUrls.default.http,
                blockExplorerUrls: [botTestnet.blockExplorers.default.url],
              },
            ],
          });
        } catch (addError) {
          console.error(addError);
        }
      }
    }
  };

  // Fetch stats from chain
  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const vaultAddress = addresses.vault as Address;

      const [assets, supply] = await Promise.all([
        publicClient.readContract({
          address: vaultAddress,
          abi: botVaultAbi,
          functionName: 'totalAssets',
        }) as Promise<bigint>,
        publicClient.readContract({
          address: vaultAddress,
          abi: botVaultAbi,
          functionName: 'totalSupply',
        }) as Promise<bigint>,
      ]);

      setTotalAssets(assets);

      // Share price calculation: 1 share (10^24 wei) in assets
      const oneShare = 10n ** BigInt(VAULT_DECIMALS);
      if (supply === 0n) {
        setSharePrice('1.000000');
      } else {
        const assetsPerShare = (await publicClient.readContract({
          address: vaultAddress,
          abi: botVaultAbi,
          functionName: 'convertToAssets',
          args: [oneShare],
        })) as bigint;
        setSharePrice((Number(formatEther(assetsPerShare))).toFixed(6));
      }

      if (account) {
        const [vBal, nativeBal] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: botVaultAbi,
            functionName: 'balanceOf',
            args: [account],
          }) as Promise<bigint>,
          publicClient.getBalance({ address: account }),
        ]);

        setUserVBotBalance(vBal);
        setUserNativeBalance(nativeBal);

        if (vBal > 0n) {
          const botVal = (await publicClient.readContract({
            address: vaultAddress,
            abi: botVaultAbi,
            functionName: 'convertToAssets',
            args: [vBal],
          })) as bigint;
          setUserBotValue(botVal);
        } else {
          setUserBotValue(0n);
        }
      }
    } catch (err) {
      console.error('Error fetching vault stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [account]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Handle Deposit
  const handleDeposit = async () => {
    if (!account || !window.ethereum) {
      connectWallet();
      return;
    }
    if (isWrongChain) {
      await switchNetwork();
      return;
    }
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setTxState({ status: 'error', message: 'Please enter a valid BOT amount.' });
      return;
    }

    try {
      setIsTransacting(true);
      setTxState({ status: 'pending', message: 'Confirm deposit transaction in your wallet...' });

      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      const hash = await walletClient.writeContract({
        address: addresses.vault as Address,
        abi: botVaultAbi,
        functionName: 'depositNative',
        value: parseEther(depositAmount),
        account,
      });

      setTxState({
        status: 'pending',
        hash,
        message: 'Transaction submitted. Waiting for confirmation...',
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setTxState({
        status: 'success',
        hash,
        message: `Successfully deposited ${depositAmount} BOT!`,
      });
      setDepositAmount('');
      fetchStats();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { shortMessage?: string; message?: string };
      setTxState({
        status: 'error',
        message: error.shortMessage || error.message || 'Deposit failed.',
      });
    } finally {
      setIsTransacting(false);
    }
  };

  // Handle Withdraw
  const handleWithdraw = async () => {
    if (!account || !window.ethereum) {
      connectWallet();
      return;
    }
    if (isWrongChain) {
      await switchNetwork();
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setTxState({ status: 'error', message: 'Please enter a valid vBOT share amount.' });
      return;
    }

    try {
      setIsTransacting(true);
      setTxState({ status: 'pending', message: 'Confirm withdrawal in your wallet...' });

      const sharesToRedeem = parseUnits(withdrawAmount, VAULT_DECIMALS);
      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      const hash = await walletClient.writeContract({
        address: addresses.vault as Address,
        abi: botVaultAbi,
        functionName: 'redeemNative',
        args: [sharesToRedeem],
        account,
      });

      setTxState({
        status: 'pending',
        hash,
        message: 'Transaction submitted. Waiting for confirmation...',
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setTxState({
        status: 'success',
        hash,
        message: `Successfully redeemed ${withdrawAmount} vBOT shares for native BOT!`,
      });
      setWithdrawAmount('');
      fetchStats();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { shortMessage?: string; message?: string };
      setTxState({
        status: 'error',
        message: error.shortMessage || error.message || 'Redemption failed.',
      });
    } finally {
      setIsTransacting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">🏦</div>
          <div>
            <h1 className="brand-title">BotVault</h1>
            <p className="brand-subtitle">ERC-4626 Tokenized Vault for Native BOT</p>
          </div>
        </div>

        <div className="header-actions">
          {account ? (
            <>
              {isWrongChain ? (
                <button className="btn btn-warning" onClick={switchNetwork}>
                  Switch to BOT Testnet
                </button>
              ) : (
                <div className="network-badge">
                  <span className="dot" />
                  BOT Testnet (968)
                </div>
              )}
              <div className="network-badge">
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
            </>
          ) : (
            <button
              className="btn btn-primary"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>

      {/* Transaction status alert */}
      {txState.status !== 'idle' && (
        <div className={`tx-banner ${txState.status}`}>
          <div>
            <span>{txState.message}</span>
            {txState.hash && (
              <a
                className="tx-link"
                href={`${addresses.explorerUrl}/tx/${txState.hash}`}
                target="_blank"
                rel="noreferrer"
              >
                View on BohrScan ↗
              </a>
            )}
          </div>
          <button
            className="tx-close"
            onClick={() => setTxState({ status: 'idle' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Panel */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">
            <span>Total Vault BOT</span>
            {isLoadingStats && <small>...</small>}
          </div>
          <div className="stat-value">
            {Number(formatEther(totalAssets)).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
            <span className="stat-unit">BOT</span>
          </div>
          <div className="stat-sub">
            Underlying assets managed in WBOT
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Share Price</span>
          </div>
          <div className="stat-value">
            {sharePrice}
            <span className="stat-unit">BOT</span>
          </div>
          <div className="stat-sub">
            Price per 1 vBOT share
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Your vBOT Balance</span>
          </div>
          <div className="stat-value">
            {account
              ? Number(formatUnits(userVBotBalance, VAULT_DECIMALS)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })
              : '—'}
            <span className="stat-unit">vBOT</span>
          </div>
          <div className="stat-sub">
            Vault shares held by your wallet
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Your BOT Value</span>
          </div>
          <div className="stat-value">
            {account
              ? Number(formatEther(userBotValue)).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })
              : '—'}
            <span className="stat-unit">BOT</span>
          </div>
          <div className="stat-sub">
            {account
              ? `Wallet: ${Number(formatEther(userNativeBalance)).toFixed(4)} BOT`
              : 'Connect wallet to view'}
          </div>
        </div>
      </section>

      {/* Actions (Deposit & Withdraw) */}
      <main className="actions-grid">
        {/* Deposit Card */}
        <div className="action-card">
          <h2 className="card-title">Deposit Native BOT</h2>
          <p className="card-desc">
            Deposit native BOT directly to receive vBOT shares. No approval needed.
          </p>

          <div className="input-box">
            <div className="input-header">
              <span>Amount</span>
              {account && (
                <span>
                  Balance: {Number(formatEther(userNativeBalance)).toFixed(4)} BOT
                </span>
              )}
            </div>
            <div className="input-row">
              <input
                type="number"
                step="any"
                min="0"
                className="amount-input"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                disabled={isTransacting}
              />
              <span className="input-currency">BOT</span>
            </div>
          </div>

          <div className="preview-row">
            <span>Estimated Shares Received:</span>
            <span>
              {depositAmount && parseFloat(depositAmount) > 0
                ? `${(parseFloat(depositAmount) / parseFloat(sharePrice || '1')).toFixed(6)} vBOT`
                : '0.00 vBOT'}
            </span>
          </div>

          <button
            className="btn btn-primary card-action-btn"
            onClick={handleDeposit}
            disabled={isTransacting || !depositAmount || parseFloat(depositAmount) <= 0}
          >
            {isTransacting ? 'Processing...' : 'Deposit BOT'}
          </button>
        </div>

        {/* Withdraw Card */}
        <div className="action-card">
          <h2 className="card-title">Redeem Shares for BOT</h2>
          <p className="card-desc">
            Redeem your vBOT shares for native BOT anytime with no strategy lockup.
          </p>

          <div className="input-box">
            <div className="input-header">
              <span>Shares to Redeem</span>
              {account && (
                <span>
                  Available:{' '}
                  {Number(formatUnits(userVBotBalance, VAULT_DECIMALS)).toFixed(4)} vBOT
                  {userVBotBalance > 0n && (
                    <button
                      className="btn-max"
                      onClick={() =>
                        setWithdrawAmount(formatUnits(userVBotBalance, VAULT_DECIMALS))
                      }
                    >
                      MAX
                    </button>
                  )}
                </span>
              )}
            </div>
            <div className="input-row">
              <input
                type="number"
                step="any"
                min="0"
                className="amount-input"
                placeholder="0.0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                disabled={isTransacting}
              />
              <span className="input-currency">vBOT</span>
            </div>
          </div>

          <div className="preview-row">
            <span>Estimated BOT to Receive:</span>
            <span>
              {withdrawAmount && parseFloat(withdrawAmount) > 0
                ? `${(parseFloat(withdrawAmount) * parseFloat(sharePrice || '1')).toFixed(6)} BOT`
                : '0.00 BOT'}
            </span>
          </div>

          <button
            className="btn btn-secondary card-action-btn"
            onClick={handleWithdraw}
            disabled={
              isTransacting ||
              !withdrawAmount ||
              parseFloat(withdrawAmount) <= 0 ||
              userVBotBalance === 0n
            }
          >
            {isTransacting ? 'Processing...' : 'Redeem BOT'}
          </button>
        </div>
      </main>

      {/* Contract Architecture Details */}
      <section className="contract-info">
        <h3 className="info-title">Deployed Contracts (BOT Testnet)</h3>
        <div className="info-rows">
          <div className="info-row">
            <span className="info-label">BotVault Contract (vBOT):</span>
            <span className="info-value">
              {addresses.vault}
              <a
                className="explorer-link"
                href={`${addresses.explorerUrl}/address/${addresses.vault}`}
                target="_blank"
                rel="noreferrer"
              >
                Explorer ↗
              </a>
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">WBOT Wrapper Contract:</span>
            <span className="info-value">
              {addresses.wbot}
              <a
                className="explorer-link"
                href={`${addresses.explorerUrl}/address/${addresses.wbot}`}
                target="_blank"
                rel="noreferrer"
              >
                Explorer ↗
              </a>
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">Network RPC / Chain ID:</span>
            <span className="info-value">
              {addresses.rpcUrl} (Chain ID: {addresses.chainId})
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="app-footer">
        BotVault &bull; ERC-4626 Native BOT Vault &bull; OpenZeppelin 5.x &bull; Inflation Protected (Offset: 6)
      </footer>
    </div>
  );
};
