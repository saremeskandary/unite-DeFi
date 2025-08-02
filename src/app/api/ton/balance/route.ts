import { NextRequest, NextResponse } from 'next/server'
import { tonIntegration, TONIntegrationService } from '@/lib/ton-integration'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const includeTokens = searchParams.get('includeTokens') === 'true'

    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      )
    }

    // Validate TON address format
    if (!TONIntegrationService.validateAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid TON address format' },
        { status: 400 }
      )
    }

    // Check if TON network is ready
    if (!tonIntegration.isNetworkReady()) {
      return NextResponse.json(
        { error: 'TON network not ready' },
        { status: 503 }
      )
    }

    // Get TON balance
    const balanceInfo = await tonIntegration.getWalletBalance()

    // Prepare response
    const response: any = {
      success: true,
      address: address,
      balance: {
        amount: balanceInfo.balance,
        formatted: balanceInfo.balanceFormatted,
        valueUSD: 0, // Will be calculated below
        lastUpdated: balanceInfo.lastUpdated
      }
    }

    // Get token balances if requested
    if (includeTokens) {
      try {
        const supportedTokens = tonIntegration.getSupportedTokens()
        const tokenBalances = []

        for (const tokenSymbol of supportedTokens) {
          const tokenInfo = await tonIntegration.getTokenInfo(tokenSymbol)
          if (tokenInfo && parseFloat(tokenInfo.balance) > 0) {
            tokenBalances.push({
              symbol: tokenInfo.symbol,
              name: tokenInfo.name,
              address: tokenInfo.address,
              decimals: tokenInfo.decimals,
              balance: tokenInfo.balance,
              balanceFormatted: tokenInfo.balanceFormatted,
              priceUSD: tokenInfo.price || 0,
              valueUSD: tokenInfo.value || 0
            })
          }
        }

        response.tokens = tokenBalances
      } catch (error) {
        console.error('Error fetching token balances:', error)
        response.tokens = []
      }
    }

    // Calculate USD value for TON balance
    try {
      const tonPrice = await tonIntegration.getTokenInfo('TON')
      if (tonPrice?.price) {
        response.balance.valueUSD = parseFloat(balanceInfo.balance) * tonPrice.price
      }
    } catch (error) {
      console.error('Error calculating TON USD value:', error)
      response.balance.valueUSD = 0
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in TON balance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 