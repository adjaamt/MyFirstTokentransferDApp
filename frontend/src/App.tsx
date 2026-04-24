import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { CONTRACT_ABI, SEPOLIA_CHAIN_ID } from './constants';

interface TransactionStatus {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  message: string;
  hash?: string;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    status: 'idle',
    message: '',
  });

  const CONTRACT_ADDRESS = localStorage.getItem('contractAddress') || '';

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const userAccount = accounts[0];
      setAccount(userAccount);

      // Switch to Sepolia if needed
      await switchToSepolia();

      // Fetch balance
      await fetchBalance(userAccount);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Switch to Sepolia network
  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added, add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: 'Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding Sepolia network:', addError);
        }
      }
    }
  };

  // Fetch token balance
  const fetchBalance = async (userAccount: string) => {
    if (!CONTRACT_ADDRESS) {
      alert('Please set the contract address in localStorage');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      );

      const rawBalance = await contract.getBalance(userAccount);
      // Convert from wei to token units (assuming 18 decimals)
      const balanceInTokens = ethers.formatUnits(rawBalance, 18);
      setBalance(balanceInTokens);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Handle transfer
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account || !recipient || !amount) {
      alert('Please fill in all fields');
      return;
    }

    if (!CONTRACT_ADDRESS) {
      alert('Contract address not set');
      return;
    }

    try {
      setTxStatus({ status: 'pending', message: 'Sending transaction...' });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Convert amount to wei (assuming 18 decimals)
      const amountInWei = ethers.parseUnits(amount, 18);

      const tx = await contract.transfer(recipient, amountInWei);
      setTxStatus({
        status: 'pending',
        message: `Transaction sent: ${tx.hash}`,
        hash: tx.hash,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      if (receipt) {
        setTxStatus({
          status: 'confirmed',
          message: 'Transaction confirmed!',
          hash: tx.hash,
        });
        // Refresh balance
        await fetchBalance(account);
        // Clear form
        setRecipient('');
        setAmount('');
      }
    } catch (error: any) {
      console.error('Error transferring:', error);
      setTxStatus({
        status: 'failed',
        message: `Transfer failed: ${error.reason || error.message}`,
      });
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount(null);
          setBalance('0');
        } else {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      window.ethereum?.removeAllListeners();
    };
  }, []);

  // Load contract address from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contractAddress');
    if (saved) {
      setContractAddress(saved);
    }
  }, []);

  // Refresh balance when contract address changes
  useEffect(() => {
    if (account && CONTRACT_ADDRESS) {
      fetchBalance(account);
    }
  }, [CONTRACT_ADDRESS]);

  return (
    <div className="app">
      <div className="container">
        <h1>MyToken DApp</h1>

        {/* Wallet Connection */}
        <div className="card">
          <h2>Wallet</h2>
          {!account ? (
            <button className="btn-primary" onClick={connectWallet}>
              Connect MetaMask
            </button>
          ) : (
            <div className="wallet-info">
              <div className="info-row">
                <span className="label">Connected Address:</span>
                <span className="address">{account}</span>
              </div>
              <div className="info-row">
                <span className="label">Balance:</span>
                <span className="balance">{Number(balance).toFixed(4)} Tokens</span>
              </div>
            </div>
          )}
        </div>

        {/* Contract Address Setup */}
        <div className="card">
          <h2>Contract Configuration</h2>
          <div className="form-group">
            <label>Contract Address:</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value);
                localStorage.setItem('contractAddress', e.target.value);
              }}
              placeholder="0x..."
              className="input"
            />
          </div>
        </div>

        {/* Transfer Form */}
        {account && (
          <div className="card">
            <h2>Transfer Tokens</h2>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label htmlFor="recipient">Recipient Address:</label>
                <input
                  id="recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount:</label>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="input"
                  step="0.01"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={txStatus.status === 'pending'}
              >
                {txStatus.status === 'pending' ? 'Sending...' : 'Transfer'}
              </button>
            </form>

            {/* Transaction Status */}
            {txStatus.status !== 'idle' && (
              <div className={`status-message status-${txStatus.status}`}>
                <p>{txStatus.message}</p>
                {txStatus.hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="etherscan-link"
                  >
                    View on Etherscan
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
