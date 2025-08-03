import { NextRequest, NextResponse } from 'next/server'
import { tonIntegration } from '@/lib/ton-integration'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionHash = searchParams.get('hash')
    const address = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!transactionHash && !address) {
      return NextResponse.json(
        { error: 'Either transaction hash or address is required' },
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

    // Get specific transaction by hash
    if (transactionHash) {
      try {
        const transactionStatus = await tonIntegration.getTransactionStatus(transactionHash)

        return NextResponse.json({
          success: true,
          transaction: {
            hash: transactionHash,
            status: transactionStatus.status,
            confirmations: transactionStatus.confirmations,
            blockNumber: transactionStatus.blockNumber,
            timestamp: new Date().toISOString(),
            network: 'TON'
          }
        })
      } catch (error) {
        console.error('Error getting transaction:', error)
        return NextResponse.json(
          { error: 'Transaction not found or network error' },
          { status: 404 }
        )
      }
    }

    // Get transactions for address
    if (address) {
      try {
        // For now, return mock transaction history
        // In production, this would fetch from TON blockchain or indexer
        const mockTransactions = [
          {
            hash: `ton_tx_${Date.now()}_1`,
            type: 'transfer',
            from: address,
            to: 'EQBRecipient1...',
            amount: '1.5',
            token: 'TON',
            status: 'confirmed',
            confirmations: 10,
            timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            fee: '0.001',
            network: 'TON'
          },
          {
            hash: `ton_tx_${Date.now()}_2`,
            type: 'swap',
            from: address,
            to: 'EQBDeDustPool...',
            amount: '5.0',
            token: 'TON',
            status: 'confirmed',
            confirmations: 25,
            timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            fee: '0.002',
            network: 'TON',
            swapDetails: {
              fromToken: 'TON',
              toToken: 'USDT',
              fromAmount: '5.0',
              toAmount: '12.5'
            }
          }
        ]

        return NextResponse.json({
          success: true,
          transactions: mockTransactions.slice(0, limit),
          total: mockTransactions.length,
          address,
          network: 'TON'
        })
      } catch (error) {
        console.error('Error getting address transactions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch transactions' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Error in TON transaction API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      fromAddress,
      toAddress,
      amount,
      token = 'TON',
      memo,
      gasLimit,
      gasPrice
    } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    // Check if TON integration is ready
    if (!tonIntegration.isReady()) {
      return NextResponse.json(
        { error: 'TON integration not ready - wallet not initialized' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'send': {
        if (!toAddress || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields: toAddress and amount' },
            { status: 400 }
          )
        }

        // Send TON transaction
        const transactionHash = await tonIntegration.sendTransaction({
          amount,
          destination: toAddress,
          payload: memo || `Transfer ${amount} ${token}`
        })

        return NextResponse.json({
          success: true,
          transactionHash,
          from: fromAddress || tonIntegration.getTONSDK().getCurrentAddress(),
          to: toAddress,
          amount,
          token,
          status: 'pending',
          timestamp: new Date().toISOString(),
          network: 'TON'
        })
      }

      case 'estimate_fee': {
        if (!toAddress || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields: toAddress and amount' },
            { status: 400 }
          )
        }

        // Estimate transaction fee
        const estimatedFee = await tonIntegration.getTONSDK().estimateFee(toAddress, amount)

        return NextResponse.json({
          success: true,
          estimatedFee,
          gasEstimate: '5000', // TON gas units
          network: 'TON'
        })
      }

      case 'batch_send': {
        const { transactions } = body

        if (!transactions || !Array.isArray(transactions)) {
          return NextResponse.json(
            { error: 'Transactions array is required' },
            { status: 400 }
          )
        }

        // Process batch transactions
        const results = []

        for (const tx of transactions) {
          try {
            const transactionHash = await tonIntegration.sendTransaction({
              amount: tx.amount,
              destination: tx.toAddress,
              payload: tx.memo || `Batch transfer ${tx.amount} ${tx.token || 'TON'}`
            })

            results.push({
              success: true,
              transactionHash,
              toAddress: tx.toAddress,
              amount: tx.amount
            })
          } catch (error) {
            results.push({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              toAddress: tx.toAddress,
              amount: tx.amount
            })
          }
        }

        return NextResponse.json({
          success: true,
          results,
          total: transactions.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        })
      }

      default:
        return NextResponse.json(
          { error: `Unsupported action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in TON transaction POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}