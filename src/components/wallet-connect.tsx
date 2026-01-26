'use client'

import { useWallet } from '../components/lib/wallet-context'
import { LogOut, Wallet } from 'lucide-react'
import { useState } from 'react'

export function WalletButton() {
  const { isConnected, address, isConnecting, connectWallet, disconnectWallet } = useWallet()
  const [showMenu, setShowMenu] = useState(false)

  const handleConnect = async () => {
    try {
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-4 py-2 bg-blue-500 text-blue-500 rounded-full font-medium hover:opacity-90 transition flex items-center gap-2"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <span className="sm:hidden">Wallet</span>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-blue-600 border border-gray-500 rounded-lg shadow-lg py-2 z-50">
            <div className="px-4 py-2 text-sm text-muted-foreground border-b border-gray-500">
              {address}
            </div>
            <button
              onClick={() => {
                disconnectWallet()
                setShowMenu(false)
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-500/50 flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2 bg-blue-500 text-primary-foreground rounded-full font-medium hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
    >
      <Wallet className="w-4 h-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
