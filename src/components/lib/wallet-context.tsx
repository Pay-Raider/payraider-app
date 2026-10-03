'use client'

import React from "react"

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { sep10AuthService } from '../../services/sep10Auth'
import { logger } from "@/lib/logger"
import { detectWallet, getWallet, isWalletId, WALLETS, type WalletId } from "@/lib/wallets"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  /** The wallet the address came from; it signs sign-in and payments. */
  walletId: WalletId | null
  isConnecting: boolean
  isAuthenticated: boolean
  authToken: string | null
  /**
   * Connect a wallet. Without an id (or when used directly as an onClick
   * handler) the first installed extension wallet is used.
   */
  connectWallet: (walletId?: WalletId | unknown) => Promise<void>
  disconnectWallet: () => void
  authenticateWithSep10: () => Promise<void>
  logout: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

const STORAGE_KEYS = {
  ADDRESS: 'stellar_wallet_address',
  WALLET: 'stellar_wallet_id',
  AUTH_TOKEN: 'stellar_sep10_token',
  TOKEN_EXPIRY: 'stellar_sep10_token_expiry',
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [walletId, setWalletId] = useState<WalletId | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Check if wallet is already connected and authenticated on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const savedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS)
        const savedToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
        const tokenExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY)

        if (savedAddress) {
          const savedWallet = localStorage.getItem(STORAGE_KEYS.WALLET)
          setAddress(savedAddress)
          // Addresses saved before wallet choice existed came from Freighter.
          setWalletId(isWalletId(savedWallet) ? savedWallet : 'freighter')
          setIsConnected(true)
        }

        // Check if token is still valid
        if (savedToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry, 10)
          const now = Date.now()

          if (now < expiryTime) {
            setAuthToken(savedToken)
            setIsAuthenticated(true)
          } else {
            // Token expired, clear it
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
            localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
          }
        }
      } catch (error) {
        logger.error('Error checking wallet connection:', error as string)
      }
    }

    checkWalletConnection()
  }, [])

  const connectWallet = useCallback(async (requested?: WalletId | unknown) => {
    setIsConnecting(true)
    try {
      const wallet = isWalletId(requested) ? getWallet(requested) : await detectWallet()
      if (!wallet) {
        throw new Error(
          `No Stellar wallet found. Install ${WALLETS.map(w => w.name).join(', ')} or choose xBull to use its web wallet.`
        )
      }

      const publicKey = await wallet.connect()
      setAddress(publicKey)
      setWalletId(wallet.id)
      setIsConnected(true)
      localStorage.setItem(STORAGE_KEYS.ADDRESS, publicKey)
      localStorage.setItem(STORAGE_KEYS.WALLET, wallet.id)
    } catch (error) {
      logger.error('Error connecting wallet:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const authenticateWithSep10 = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    try {
      // Perform SEP-10 authentication
      const result = await sep10AuthService.authenticate(address, {
        homeDomain: window.location.hostname,
        wallet: walletId ?? undefined,
      })

      // Store token and expiry
      const expiryTime = Date.now() + result.expires_in * 1000
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token)
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString())

      setAuthToken(result.token)
      setIsAuthenticated(true)
    } catch (error) {
      logger.error('SEP-10 authentication failed:', error)
      throw error
    }
  }, [address, walletId])

  const logout = useCallback(async () => {
    if (authToken) {
      try {
        await sep10AuthService.logout(authToken)
      } catch (error) {
        logger.error('Logout failed:', error)
      }
    }

    // Clear authentication state
    setAuthToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY)
  }, [authToken])

  const disconnectWallet = useCallback(async () => {
    // Logout first if authenticated
    if (isAuthenticated) {
      await logout()
    }

    // Clear wallet connection
    setAddress(null)
    setWalletId(null)
    setIsConnected(false)
    localStorage.removeItem(STORAGE_KEYS.ADDRESS)
    localStorage.removeItem(STORAGE_KEYS.WALLET)
  }, [isAuthenticated, logout])

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        walletId,
        isConnecting,
        isAuthenticated,
        authToken,
        connectWallet,
        disconnectWallet,
        authenticateWithSep10,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
