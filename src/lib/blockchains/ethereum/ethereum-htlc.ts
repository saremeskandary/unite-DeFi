import { ethers } from 'ethers';

export interface HTLCContract {
  address: string;
  abi: ethers.InterfaceAbi;
}

export interface HTLCSwap {
  hashlock: string;
  recipient: string;
  sender: string;
  locktime: bigint;
  amount: bigint;
  withdrawn: boolean;
  refunded: boolean;
}

export interface CreateHTLCParams {
  secretHash: string;
  recipient: string;
  locktime: number;
  amount: string;
  signer: ethers.Signer;
  contractAddress: string;
}

export interface WithdrawHTLCParams {
  contractId: string;
  preimage: string;
  signer: ethers.Signer;
  contractAddress: string;
}

export interface RefundHTLCParams {
  contractId: string;
  signer: ethers.Signer;
  contractAddress: string;
}

export interface HTLCStatus {
  exists: boolean;
  withdrawn: boolean;
  refunded: boolean;
  locktime: bigint;
  amount: bigint;
  recipient: string;
  sender: string;
}

// HTLC Contract ABI
export const HTLC_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_hashlock",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "_recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_locktime",
        "type": "uint256"
      }
    ],
    "name": "newContract",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "contractId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_contractId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "_preimage",
        "type": "bytes32"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_contractId",
        "type": "bytes32"
      }
    ],
    "name": "refund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "_contractId",
        "type": "bytes32"
      }
    ],
    "name": "getContract",
    "outputs": [
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "hashlock",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "locktime",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "withdrawn",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "refunded",
            "type": "bool"
          }
        ],
        "internalType": "struct HTLC.Swap",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "contractId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "locktime",
        "type": "uint256"
      }
    ],
    "name": "HTLCNew",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "contractId",
        "type": "bytes32"
      }
    ],
    "name": "HTLCWithdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "contractId",
        "type": "bytes32"
      }
    ],
    "name": "HTLCRefund",
    "type": "event"
  }
] as const;

export class EthereumHTLCService {
  private provider: ethers.Provider | null = null;

  constructor(provider?: ethers.Provider) {
    this.provider = provider || null;
  }

  /**
   * Create a new HTLC contract
   */
  async createHTLC(params: CreateHTLCParams): Promise<{ success: boolean; contractId?: string; error?: string }> {
    try {
      const { secretHash, recipient, locktime, amount, signer, contractAddress } = params;

      // Validate inputs
      if (!secretHash || !recipient || locktime <= 0 || !amount) {
        throw new Error('Invalid HTLC parameters');
      }

      const contract = new ethers.Contract(contractAddress, HTLC_ABI, signer);

      // Create the contract with ETH
      const tx = await contract.newContract(
        secretHash,
        recipient,
        locktime,
        { value: amount }
      );

      const receipt = await tx.wait();

      // Extract contract ID from event
      const event = receipt.logs.find((log: any) =>
        log.topics[0] === contract.interface.getEvent('HTLCNew')?.topicHash
      );

      if (!event) {
        throw new Error('HTLC creation event not found');
      }

      const contractId = event.topics[1]; // contractId is the first indexed parameter

      return {
        success: true,
        contractId: contractId
      };

    } catch (error) {
      console.error('Error creating HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Withdraw from HTLC using preimage
   */
  async withdrawHTLC(params: WithdrawHTLCParams): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const { contractId, preimage, signer, contractAddress } = params;

      const contract = new ethers.Contract(contractAddress, HTLC_ABI, signer);

      const tx = await contract.withdraw(contractId, preimage);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error) {
      console.error('Error withdrawing from HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Refund HTLC after timeout
   */
  async refundHTLC(params: RefundHTLCParams): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const { contractId, signer, contractAddress } = params;

      const contract = new ethers.Contract(contractAddress, HTLC_ABI, signer);

      const tx = await contract.refund(contractId);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash
      };

    } catch (error) {
      console.error('Error refunding HTLC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get HTLC contract status
   */
  async getHTLCStatus(contractId: string, contractAddress: string): Promise<HTLCStatus | null> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const contract = new ethers.Contract(contractAddress, HTLC_ABI, this.provider);
      const swap = await contract.getContract(contractId);

      return {
        exists: true,
        withdrawn: swap.withdrawn,
        refunded: swap.refunded,
        locktime: swap.locktime,
        amount: swap.amount,
        recipient: swap.recipient,
        sender: swap.sender
      };

    } catch (error) {
      console.error('Error getting HTLC status:', error);
      return null;
    }
  }

  /**
   * Calculate contract ID from parameters
   */
  calculateContractId(sender: string, recipient: string, hashlock: string, locktime: number): string {
    const encoded = ethers.solidityPacked(
      ['address', 'address', 'bytes32', 'uint256'],
      [sender, recipient, hashlock, locktime]
    );
    return ethers.keccak256(encoded);
  }

  /**
   * Generate secret hash from secret
   */
  generateSecretHash(secret: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(secret));
  }

  /**
   * Generate random secret
   */
  generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }
} 