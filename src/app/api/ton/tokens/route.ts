import { NextRequest, NextResponse } from 'next/server'
import { tonIntegration } from '@/lib/ton-integration'
import { deDustAPI } from '@/lib/dedust-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const includeBalances = searchParams.get('includeBalances') === 'true'
    const includePrices = searchParams.get('includePrices') === 'true'

    // Check if TON network is ready
    if (!tonIntegration.isNetworkReady()) {
      return NextResponse.json(
        { error: 'TON network not ready' },
        { status: 503 }
      )
    }

    // Get supported tokens
    const supportedTokens = tonIntegration.getSupportedTokens()
    const tokenList = []

    for (const tokenSymbol of supportedTokens) {
      try {
        const tokenInfo = await tonIntegration.getTokenInfo(tokenSymbol)

        if (tokenInfo) {
          const token: any = {
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            address: tokenInfo.address,
            decimals: tokenInfo.decimals,
            network: 'TON'
          }

          // Include balance if address provided and requested
          if (address && includeBalances) {
            token.balance = tokenInfo.balance
            token.balanceFormatted = tokenInfo.balanceFormatted
          }

          // Include price if requested
          if (includePrices) {
            try {
              const price = await deDustAPI.getTokenPrice(tokenSymbol)
              token.priceUSD = price || 0

              if (address && includeBalances && tokenInfo.value) {
                token.valueUSD = tokenInfo.value
              }
            } catch (error) {
              console.error(`Error getting price for ${tokenSymbol}:`, error)
              token.priceUSD = 0
            }
          }

          tokenList.push(token)
        }
      } catch (error) {
        console.error(`Error getting info for token ${tokenSymbol}:`, error)
        // Continue with other tokens
      }
    }

    // Add popular Jetton tokens (placeholder for future implementation)
    const popularJettons = [
      {
        symbol: 'USDT',
        name: 'Tether USD',
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6,
        network: 'TON',
        isJetton: true
      },
      {
        symbol: 'USDC',
        name: 'USD Coin',
        address: 'EQB-MPwrd1G6WKNkLz_VnV6WqBDd142KMQv-g1O-8QUA3728',
        decimals: 6,
        network: 'TON',
        isJetton: true
      },
      {
        symbol: 'STON',
        name: 'StonFi Token',
        address: 'EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO',
        decimals: 9,
        network: 'TON',
        isJetton: true
      }
    ]

    // Add popular tokens with placeholder data if not address-specific
    if (!address) {
      for (const jetton of popularJettons) {
        const token: any = { ...jetton }

        if (includePrices) {
          try {
            const price = await deDustAPI.getTokenPrice(jetton.symbol)
            token.priceUSD = price || 0
          } catch (error) {
            token.priceUSD = 0
          }
        }

        tokenList.push(token)
      }
    }

    return NextResponse.json({
      success: true,
      tokens: tokenList,
      totalTokens: tokenList.length,
      network: 'TON',
      supportedFeatures: [
        'native_ton',
        'jetton_tokens',
        'cross_chain_swaps',
        'dedust_integration'
      ]
    })
  } catch (error) {
    console.error('Error in TON tokens API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tokenAddress, amount, recipient } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Check if TON integration is ready
    if (!tonIntegration.isReady()) {
      return NextResponse.json(
        { error: 'TON integration not ready' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'transfer': {
        if (!tokenAddress || !amount || !recipient) {
          return NextResponse.json(
            { error: 'Missing required fields for transfer' },
            { status: 400 }
          )
        }

        // Execute token transfer
        const transactionHash = await tonIntegration.sendTransaction({
          amount,
          destination: recipient,
          payload: `Token transfer: ${amount}`
        })

        return NextResponse.json({
          success: true,
          transactionHash,
          message: 'Token transfer initiated'
        })
      }

      case 'approve': {
        if (!tokenAddress || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields for approval' },
            { status: 400 }
          )
        }

        // Token approval (for Jettons this would be different)
        return NextResponse.json({
          success: true,
          message: 'Token approval not required for TON native transfers'
        })
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in TON tokens POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}