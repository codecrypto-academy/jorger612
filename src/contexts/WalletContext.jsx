import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // ProductTracker contract ABI and address
  const CONTRACT_ADDRESS = '0x7561eaf103403953a05ED3e6d6023f1d0366e1B2'
  const CONTRACT_ABI = [
    "function addEvent(string memory label, uint256 timestamp, bytes memory signature) public",
    "function addEvents(string[] memory labels, uint256 timestamp, bytes memory signature) public",
    "function getEvents(string memory label) public view returns (tuple(address organization, uint256 timestamp, bytes signature)[] memory)",
    "event EventAdded(string indexed label, address indexed organization, uint256 timestamp)"
  ]

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask no está instalado')
      return
    }

    setIsConnecting(true)
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      const account = accounts[0]
      
      // Create provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      
      setAccount(account)
      setProvider(provider)
      setSigner(signer)
      
      toast.success('Wallet conectada exitosamente')
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Error al conectar wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    toast.success('Wallet desconectada')
  }

  const getContract = () => {
    if (!signer) return null
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
  }

  const getContractReadOnly = () => {
    if (!provider) return null
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  }

  // Handle account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          setAccount(accounts[0])
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }
  }, [])

  const value = {
    account,
    provider,
    signer,
    isConnecting,
    connectWallet,
    disconnectWallet,
    getContract,
    getContractReadOnly,
    CONTRACT_ADDRESS
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}
