import React, { useState, useEffect, useCallback } from 'react';
import {
  createWalletClient,
  custom,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  type Address,
  maxUint256,
} from 'viem';
import {
  botTestnet,
  addresses,
  botVaultAbi,
  wbotAbi,
  publicClient,
  VAULT_DECIMALS,
} from './contracts';
import './App.css';

interface TxState {
  status: 'idle' | 'pending' | 'success' | 'error';
  hash?: string;
  message?: string;
}

type TabType = 'native' | 'erc4626' | 'wrapper' | 'calculator';
type Erc4626Action = 'deposit' | 'mint' | 'withdraw' | 'redeem';
type WrapperAction = 'wrap' | 'unwrap' | 'donate';

export const App: React.FC = () => {
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('native');

  // Vault data
  const [totalAssets, setTotalAssets] = useState<bigint>(0n);
  const [totalSupply, setTotalSupply] = useState<bigint>(0n);
  const [sharePrice, setSharePrice] = useState<string>('1.000000');
  const [userVBotBalance, setUserVBotBalance] = useState<bigint>(0n);
  const [userBotValue, setUserBotValue] = useState<bigint>(0n);
  const [userNativeBalance, setUserNativeBalance] = useState<bigint>(0n);
  const [userWBotBalance, setUserWBotBalance] = useState<bigint>(0n);
  const [wbotAllowance, setWbotAllowance] = useState<bigint>(0n);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Tab 1: Native inputs
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  // Tab 2: ERC-4626 Standard inputs
  const [ercAction, setErcAction] = useState<Erc4626Action>('deposit');
  const [ercAmount, setErcAmount] = useState<string>('');
  const [ercReceiver, setErcReceiver] = useState<string>('');

  // Tab 3: Wrapper & Yield inputs
  const [wrapperAction, setWrapperAction] = useState<WrapperAction>('wrap');
  const [wrapperAmount, setWrapperAmount] = useState<string>('');

  // Tab 4: Calculator inputs
  const [calcInputType, setCalcInputType] = useState<'assets' | 'shares'>('assets');
  const [calcInputValue, setCalcInputValue] = useState<string>('1');
  const [calcResult, setCalcResult] = useState<string>('');

  const [isTransacting, setIsTransacting] = useState(false);
  const [txState, setTxState] = useState<TxState>({ status: 'idle' });

  const isWrongChain = chainId !== null && chainId !== botTestnet.id;

  // Initialize wallet connection if available
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
      const wbotAddress = addresses.wbot as Address;

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
      setTotalSupply(supply);

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
        setSharePrice(Number(formatEther(assetsPerShare)).toFixed(6));
      }

      if (account) {
        const [vBal, nativeBal, wBal, allowance] = await Promise.all([
          publicClient.readContract({
            address: vaultAddress,
            abi: botVaultAbi,
            functionName: 'balanceOf',
            args: [account],
          }) as Promise<bigint>,
          publicClient.getBalance({ address: account }),
          publicClient.readContract({
            address: wbotAddress,
            abi: wbotAbi,
            functionName: 'balanceOf',
            args: [account],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: wbotAddress,
            abi: wbotAbi,
            functionName: 'allowance',
            args: [account, vaultAddress],
          }) as Promise<bigint>,
        ]);

        setUserVBotBalance(vBal);
        setUserNativeBalance(nativeBal);
        setUserWBotBalance(wBal);
        setWbotAllowance(allowance);

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

  // Update calculator result
  useEffect(() => {
    const updateCalculator = async () => {
      if (!calcInputValue || parseFloat(calcInputValue) < 0) {
        setCalcResult('0');
        return;
      }
      try {
        const vaultAddress = addresses.vault as Address;
        if (calcInputType === 'assets') {
          const assetsWei = parseEther(calcInputValue);
          const shares = (await publicClient.readContract({
            address: vaultAddress,
            abi: botVaultAbi,
            functionName: 'convertToShares',
            args: [assetsWei],
          })) as bigint;
          setCalcResult(`${Number(formatUnits(shares, VAULT_DECIMALS)).toFixed(6)} vBOT`);
        } else {
          const sharesWei = parseUnits(calcInputValue, VAULT_DECIMALS);
          const assets = (await publicClient.readContract({
            address: vaultAddress,
            abi: botVaultAbi,
            functionName: 'convertToAssets',
            args: [sharesWei],
          })) as bigint;
          setCalcResult(`${Number(formatEther(assets)).toFixed(6)} BOT`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    updateCalculator();
  }, [calcInputType, calcInputValue, totalAssets, totalSupply]);

  // Tab 1: Handle Native Deposit
  const handleDepositNative = async () => {
    if (!account || !window.ethereum) return connectWallet();
    if (isWrongChain) return switchNetwork();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return setTxState({ status: 'error', message: 'Enter a valid BOT amount.' });
    }

    try {
      setIsTransacting(true);
      setTxState({ status: 'pending', message: 'Confirm depositNative transaction...' });

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

      setTxState({ status: 'pending', hash, message: 'Deposit pending confirmation...' });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash, message: `Deposited ${depositAmount} BOT directly!` });
      setDepositAmount('');
      fetchStats();
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      setTxState({ status: 'error', message: error.shortMessage || error.message || 'Deposit failed.' });
    } finally {
      setIsTransacting(false);
    }
  };

  // Tab 1: Handle Native Redeem
  const handleRedeemNative = async () => {
    if (!account || !window.ethereum) return connectWallet();
    if (isWrongChain) return switchNetwork();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return setTxState({ status: 'error', message: 'Enter a valid vBOT amount.' });
    }

    try {
      setIsTransacting(true);
      setTxState({ status: 'pending', message: 'Confirm redeemNative transaction...' });

      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      const hash = await walletClient.writeContract({
        address: addresses.vault as Address,
        abi: botVaultAbi,
        functionName: 'redeemNative',
        args: [parseUnits(withdrawAmount, VAULT_DECIMALS)],
        account,
      });

      setTxState({ status: 'pending', hash, message: 'Redemption pending confirmation...' });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash, message: `Redeemed ${withdrawAmount} vBOT for native BOT!` });
      setWithdrawAmount('');
      fetchStats();
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      setTxState({ status: 'error', message: error.shortMessage || error.message || 'Redemption failed.' });
    } finally {
      setIsTransacting(false);
    }
  };

  // Tab 2: Approve WBOT for Vault
  const handleApproveWbot = async () => {
    if (!account || !window.ethereum) return connectWallet();
    if (isWrongChain) return switchNetwork();

    try {
      setIsTransacting(true);
      setTxState({ status: 'pending', message: 'Approving WBOT spending for BotVault...' });

      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      const hash = await walletClient.writeContract({
        address: addresses.wbot as Address,
        abi: wbotAbi,
        functionName: 'approve',
        args: [addresses.vault as Address, maxUint256],
        account,
      });

      setTxState({ status: 'pending', hash, message: 'Waiting for approval confirmation...' });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash, message: 'WBOT approval granted!' });
      fetchStats();
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      setTxState({ status: 'error', message: error.shortMessage || error.message || 'Approval failed.' });
    } finally {
      setIsTransacting(false);
    }
  };

  // Tab 2: Standard ERC-4626 Actions (deposit, mint, withdraw, redeem)
  const handleErc4626Submit = async () => {
    if (!account || !window.ethereum) return connectWallet();
    if (isWrongChain) return switchNetwork();
    if (!ercAmount || parseFloat(ercAmount) <= 0) {
      return setTxState({ status: 'error', message: 'Enter a valid amount.' });
    }

    const receiverAddr = (ercReceiver.trim() || account) as Address;

    try {
      setIsTransacting(true);
      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      let hash: Address;
      if (ercAction === 'deposit') {
        const assets = parseEther(ercAmount);
        setTxState({ status: 'pending', message: 'Confirming ERC-4626 deposit(assets, receiver)...' });
        hash = await walletClient.writeContract({
          address: addresses.vault as Address,
          abi: botVaultAbi,
          functionName: 'deposit',
          args: [assets, receiverAddr],
          account,
        });
      } else if (ercAction === 'mint') {
        const shares = parseUnits(ercAmount, VAULT_DECIMALS);
        setTxState({ status: 'pending', message: 'Confirming ERC-4626 mint(shares, receiver)...' });
        hash = await walletClient.writeContract({
          address: addresses.vault as Address,
          abi: botVaultAbi,
          functionName: 'mint',
          args: [shares, receiverAddr],
          account,
        });
      } else if (ercAction === 'withdraw') {
        const assets = parseEther(ercAmount);
        setTxState({ status: 'pending', message: 'Confirming ERC-4626 withdraw(assets, receiver, owner)...' });
        hash = await walletClient.writeContract({
          address: addresses.vault as Address,
          abi: botVaultAbi,
          functionName: 'withdraw',
          args: [assets, receiverAddr, account],
          account,
        });
      } else {
        const shares = parseUnits(ercAmount, VAULT_DECIMALS);
        setTxState({ status: 'pending', message: 'Confirming ERC-4626 redeem(shares, receiver, owner)...' });
        hash = await walletClient.writeContract({
          address: addresses.vault as Address,
          abi: botVaultAbi,
          functionName: 'redeem',
          args: [shares, receiverAddr, account],
          account,
        });
      }

      setTxState({ status: 'pending', hash, message: `${ercAction} submitted. Confirming...` });
      await publicClient.waitForTransactionReceipt({ hash });
      setTxState({ status: 'success', hash, message: `ERC-4626 ${ercAction} successful!` });
      setErcAmount('');
      fetchStats();
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      setTxState({ status: 'error', message: error.shortMessage || error.message || `${ercAction} failed.` });
    } finally {
      setIsTransacting(false);
    }
  };

  // Tab 3: Wrapper & Yield Donation Actions (Wrap, Unwrap, Donate)
  const handleWrapperSubmit = async () => {
    if (!account || !window.ethereum) return connectWallet();
    if (isWrongChain) return switchNetwork();
    if (!wrapperAmount || parseFloat(wrapperAmount) <= 0) {
      return setTxState({ status: 'error', message: 'Enter a valid amount.' });
    }

    try {
      setIsTransacting(true);
      const walletClient = createWalletClient({
        chain: botTestnet,
        transport: custom(window.ethereum),
      });

      let hash: Address;
      const amountWei = parseEther(wrapperAmount);

      if (wrapperAction === 'wrap') {
        setTxState({ status: 'pending', message: 'Wrapping native BOT to WBOT...' });
        hash = await walletClient.writeContract({
          address: addresses.wbot as Address,
          abi: wbotAbi,
          functionName: 'deposit',
          value: amountWei,
          account,
        });
      } else if (wrapperAction === 'unwrap') {
        setTxState({ status: 'pending', message: 'Unwrapping WBOT to native BOT...' });
        hash = await walletClient.writeContract({
          address: addresses.wbot as Address,
          abi: wbotAbi,
          functionName: 'withdraw',
          args: [amountWei],
          account,
        });
      } else {
        // Donate WBOT to BotVault contract
        setTxState({ status: 'pending', message: 'Donating WBOT directly to BotVault to boost share price...' });
        hash = await walletClient.writeContract({
          address: addresses.wbot as Address,
          abi: wbotAbi,
          functionName: 'transfer',
          args: [addresses.vault as Address, amountWei],
          account,
        });
      }

      setTxState({ status: 'pending', hash, message: 'Transaction submitted. Confirming...' });
      await publicClient.waitForTransactionReceipt({ hash });
      const successMsg =
        wrapperAction === 'donate'
          ? `Donated ${wrapperAmount} WBOT! Share price increased for all vault holders.`
          : `${wrapperAction === 'wrap' ? 'Wrapped' : 'Unwrapped'} ${wrapperAmount} BOT!`;
      setTxState({ status: 'success', hash, message: successMsg });
      setWrapperAmount('');
      fetchStats();
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      setTxState({ status: 'error', message: error.shortMessage || error.message || 'Action failed.' });
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
            <p className="brand-subtitle">Complete ERC-4626 Tokenized Vault & Native DeFi Suite</p>
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
            <button className="btn btn-primary" onClick={connectWallet} disabled={isConnecting}>
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
          <button className="tx-close" onClick={() => setTxState({ status: 'idle' })}>
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
            {Number(formatEther(totalAssets)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            <span className="stat-unit">BOT</span>
          </div>
          <div className="stat-sub">
            Backing: {Number(formatEther(totalAssets)).toFixed(4)} WBOT
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
            <span>Total vBOT Supply</span>
          </div>
          <div className="stat-value">
            {Number(formatUnits(totalSupply, VAULT_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
            <span className="stat-unit">vBOT</span>
          </div>
          <div className="stat-sub">
            24 decimals (18 + 6 offset)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Your vBOT Balance</span>
          </div>
          <div className="stat-value">
            {account
              ? Number(formatUnits(userVBotBalance, VAULT_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 4 })
              : '—'}
            <span className="stat-unit">vBOT</span>
          </div>
          <div className="stat-sub">
            {account ? `Value: ${Number(formatEther(userBotValue)).toFixed(4)} BOT` : 'Connect wallet'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Your Wallet Assets</span>
          </div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {account ? `${Number(formatEther(userNativeBalance)).toFixed(3)} BOT` : '—'}
          </div>
          <div className="stat-sub">
            {account ? `${Number(formatEther(userWBotBalance)).toFixed(3)} WBOT` : 'Connect wallet'}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'native' ? 'active' : ''}`}
          onClick={() => setActiveTab('native')}
        >
          ⚡ Native BOT (1-Click Vault)
        </button>
        <button
          className={`tab-btn ${activeTab === 'erc4626' ? 'active' : ''}`}
          onClick={() => setActiveTab('erc4626')}
        >
          🏦 ERC-4626 Standard (WBOT)
        </button>
        <button
          className={`tab-btn ${activeTab === 'wrapper' ? 'active' : ''}`}
          onClick={() => setActiveTab('wrapper')}
        >
          🔄 Wrap & Yield Donation
        </button>
        <button
          className={`tab-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          🧮 Interactive Calculator
        </button>
      </nav>

      {/* TAB 1: Native BOT Flow */}
      {activeTab === 'native' && (
        <main className="actions-grid">
          {/* Deposit Card */}
          <div className="action-card">
            <h2 className="card-title">Deposit Native BOT</h2>
            <p className="card-desc">
              Directly deposit native BOT via <code>depositNative()</code>. Automatically wraps into WBOT and mints vBOT shares with 0 approvals.
            </p>

            <div className="input-box">
              <div className="input-header">
                <span>Amount</span>
                {account && <span>Wallet: {Number(formatEther(userNativeBalance)).toFixed(4)} BOT</span>}
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
              onClick={handleDepositNative}
              disabled={isTransacting || !depositAmount || parseFloat(depositAmount) <= 0}
            >
              {isTransacting ? 'Processing...' : 'Deposit Native BOT'}
            </button>
          </div>

          {/* Withdraw Card */}
          <div className="action-card">
            <h2 className="card-title">Redeem Shares for Native BOT</h2>
            <p className="card-desc">
              Directly exit vault shares via <code>redeemNative()</code>. Burns vBOT shares, unwraps WBOT, and sends native BOT to your wallet.
            </p>

            <div className="input-box">
              <div className="input-header">
                <span>Shares to Redeem</span>
                {account && (
                  <span>
                    Owned: {Number(formatUnits(userVBotBalance, VAULT_DECIMALS)).toFixed(4)} vBOT
                    {userVBotBalance > 0n && (
                      <button
                        className="btn-max"
                        onClick={() => setWithdrawAmount(formatUnits(userVBotBalance, VAULT_DECIMALS))}
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
              <span>Estimated BOT Payout:</span>
              <span>
                {withdrawAmount && parseFloat(withdrawAmount) > 0
                  ? `${(parseFloat(withdrawAmount) * parseFloat(sharePrice || '1')).toFixed(6)} BOT`
                  : '0.00 BOT'}
              </span>
            </div>

            <button
              className="btn btn-secondary card-action-btn"
              onClick={handleRedeemNative}
              disabled={
                isTransacting ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                userVBotBalance === 0n
              }
            >
              {isTransacting ? 'Processing...' : 'Redeem for Native BOT'}
            </button>
          </div>
        </main>
      )}

      {/* TAB 2: Standard ERC-4626 Operations with WBOT */}
      {activeTab === 'erc4626' && (
        <main className="action-card" style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
          <h2 className="card-title">Standard ERC-4626 Operations (WBOT)</h2>
          <p className="card-desc">
            Interact with the vault using the standard ERC-4626 asset interface. Supports deposits, minting exact shares, asset withdrawals, and custom receivers.
          </p>

          <div className="sub-toggle">
            <button
              className={`sub-toggle-btn ${ercAction === 'deposit' ? 'active' : ''}`}
              onClick={() => setErcAction('deposit')}
            >
              Deposit Assets
            </button>
            <button
              className={`sub-toggle-btn ${ercAction === 'mint' ? 'active' : ''}`}
              onClick={() => setErcAction('mint')}
            >
              Mint Shares
            </button>
            <button
              className={`sub-toggle-btn ${ercAction === 'withdraw' ? 'active' : ''}`}
              onClick={() => setErcAction('withdraw')}
            >
              Withdraw Assets
            </button>
            <button
              className={`sub-toggle-btn ${ercAction === 'redeem' ? 'active' : ''}`}
              onClick={() => setErcAction('redeem')}
            >
              Redeem Shares
            </button>
          </div>

          <div className="input-box">
            <div className="input-header">
              <span>
                {ercAction === 'deposit' || ercAction === 'withdraw'
                  ? 'WBOT Assets Amount'
                  : 'vBOT Shares Amount'}
              </span>
              {account && (
                <span>
                  {ercAction === 'deposit' || ercAction === 'mint'
                    ? `WBOT: ${Number(formatEther(userWBotBalance)).toFixed(4)}`
                    : `vBOT: ${Number(formatUnits(userVBotBalance, VAULT_DECIMALS)).toFixed(4)}`}
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
                value={ercAmount}
                onChange={(e) => setErcAmount(e.target.value)}
                disabled={isTransacting}
              />
              <span className="input-currency">
                {ercAction === 'deposit' || ercAction === 'withdraw' ? 'WBOT' : 'vBOT'}
              </span>
            </div>
          </div>

          <div className="input-box">
            <div className="input-header">
              <span>Receiver Address (Optional, defaults to your address)</span>
            </div>
            <input
              type="text"
              className="text-input"
              placeholder={account || '0x...'}
              value={ercReceiver}
              onChange={(e) => setErcReceiver(e.target.value)}
              disabled={isTransacting}
            />
          </div>

          {(ercAction === 'deposit' || ercAction === 'mint') && wbotAllowance < parseEther(ercAmount || '0') && (
            <div style={{ marginBottom: '14px' }}>
              <button
                className="btn btn-warning card-action-btn"
                onClick={handleApproveWbot}
                disabled={isTransacting}
              >
                Approve BotVault to spend WBOT
              </button>
            </div>
          )}

          <button
            className="btn btn-primary card-action-btn"
            onClick={handleErc4626Submit}
            disabled={
              isTransacting ||
              !ercAmount ||
              parseFloat(ercAmount) <= 0 ||
              ((ercAction === 'deposit' || ercAction === 'mint') && wbotAllowance < parseEther(ercAmount || '0'))
            }
          >
            {isTransacting ? 'Executing...' : `Execute ${ercAction.toUpperCase()}`}
          </button>
        </main>
      )}

      {/* TAB 3: Wrapper & Yield Donation Simulation */}
      {activeTab === 'wrapper' && (
        <main className="actions-grid">
          {/* Wrapper Card */}
          <div className="action-card">
            <h2 className="card-title">WBOT Wrapper</h2>
            <p className="card-desc">
              Convert native BOT into ERC-20 compliant WBOT tokens, or unwrap WBOT back to native BOT (1:1 ratio).
            </p>

            <div className="sub-toggle">
              <button
                className={`sub-toggle-btn ${wrapperAction === 'wrap' ? 'active' : ''}`}
                onClick={() => setWrapperAction('wrap')}
              >
                Wrap (BOT &rarr; WBOT)
              </button>
              <button
                className={`sub-toggle-btn ${wrapperAction === 'unwrap' ? 'active' : ''}`}
                onClick={() => setWrapperAction('unwrap')}
              >
                Unwrap (WBOT &rarr; BOT)
              </button>
            </div>

            <div className="input-box">
              <div className="input-header">
                <span>Amount</span>
                {account && (
                  <span>
                    {wrapperAction === 'wrap'
                      ? `Native: ${Number(formatEther(userNativeBalance)).toFixed(4)} BOT`
                      : `WBOT: ${Number(formatEther(userWBotBalance)).toFixed(4)} WBOT`}
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
                  value={wrapperAmount}
                  onChange={(e) => setWrapperAmount(e.target.value)}
                  disabled={isTransacting}
                />
                <span className="input-currency">{wrapperAction === 'wrap' ? 'BOT' : 'WBOT'}</span>
              </div>
            </div>

            <button
              className="btn btn-primary card-action-btn"
              onClick={handleWrapperSubmit}
              disabled={isTransacting || !wrapperAmount || parseFloat(wrapperAmount) <= 0}
            >
              {isTransacting ? 'Processing...' : wrapperAction === 'wrap' ? 'Wrap BOT' : 'Unwrap WBOT'}
            </button>
          </div>

          {/* Donation / Yield Simulator Card */}
          <div className="action-card">
            <h2 className="card-title">Simulate Vault Yield (Donation)</h2>
            <p className="card-desc">
              In ERC-4626, direct asset transfers to the vault increase <code>totalAssets()</code> without minting new shares. This instantly boosts the share price for all existing vault depositors!
            </p>

            <div className="input-box">
              <div className="input-header">
                <span>WBOT Donation Amount</span>
                {account && <span>WBOT Balance: {Number(formatEther(userWBotBalance)).toFixed(4)}</span>}
              </div>
              <div className="input-row">
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="amount-input"
                  placeholder="0.0"
                  value={wrapperAmount}
                  onChange={(e) => setWrapperAmount(e.target.value)}
                  disabled={isTransacting}
                />
                <span className="input-currency">WBOT</span>
              </div>
            </div>

            <div className="preview-row">
              <span>Effect on Share Price:</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>Increases vBOT value for all holders &uarr;</span>
            </div>

            <button
              className="btn btn-secondary card-action-btn"
              onClick={() => {
                setWrapperAction('donate');
                handleWrapperSubmit();
              }}
              disabled={isTransacting || !wrapperAmount || parseFloat(wrapperAmount) <= 0 || userWBotBalance === 0n}
            >
              {isTransacting ? 'Donating...' : 'Donate WBOT to Vault'}
            </button>
          </div>
        </main>
      )}

      {/* TAB 4: Interactive Calculator & ERC-4626 Previews */}
      {activeTab === 'calculator' && (
        <main className="action-card" style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
          <h2 className="card-title">Live Vault Calculator & Previews</h2>
          <p className="card-desc">
            Directly test the mathematical conversion functions of the ERC-4626 contract (<code>convertToShares</code> and <code>convertToAssets</code>) using live on-chain state.
          </p>

          <div className="sub-toggle">
            <button
              className={`sub-toggle-btn ${calcInputType === 'assets' ? 'active' : ''}`}
              onClick={() => setCalcInputType('assets')}
            >
              Assets (BOT) &rarr; Shares (vBOT)
            </button>
            <button
              className={`sub-toggle-btn ${calcInputType === 'shares' ? 'active' : ''}`}
              onClick={() => setCalcInputType('shares')}
            >
              Shares (vBOT) &rarr; Assets (BOT)
            </button>
          </div>

          <div className="input-box">
            <div className="input-header">
              <span>{calcInputType === 'assets' ? 'Input Assets (BOT)' : 'Input Shares (vBOT)'}</span>
            </div>
            <div className="input-row">
              <input
                type="number"
                step="any"
                min="0"
                className="amount-input"
                placeholder="1.0"
                value={calcInputValue}
                onChange={(e) => setCalcInputValue(e.target.value)}
              />
              <span className="input-currency">{calcInputType === 'assets' ? 'BOT' : 'vBOT'}</span>
            </div>
          </div>

          <div className="stat-card" style={{ marginTop: '16px', background: '#0b0f19' }}>
            <div className="stat-label">Calculated Output:</div>
            <div className="stat-value" style={{ color: '#60a5fa' }}>
              {calcResult || 'Calculating...'}
            </div>
            <div className="stat-sub">
              Formula: <code>assets &times; (totalSupply + 10^6) &divide; (totalAssets + 1)</code>
            </div>
          </div>
        </main>
      )}

      {/* Contract Architecture Details */}
      <section className="contract-info">
        <h3 className="info-title">Deployed Smart Contracts (BOT Testnet)</h3>
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
        BotVault &bull; Complete ERC-4626 Native BOT Suite &bull; OpenZeppelin 5.x &bull; Inflation Shielded (Offset: 6)
      </footer>
    </div>
  );
};
