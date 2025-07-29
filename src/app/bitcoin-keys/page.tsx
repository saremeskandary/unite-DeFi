import { BitcoinKeyGeneratorComponent } from '@/components/BitcoinKeyGenerator';

export default function BitcoinKeysPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bitcoin WIF Key Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate Bitcoin private keys in WIF format for use with the 1inch Fusion+ integration
          </p>
        </div>
        
        <BitcoinKeyGeneratorComponent />
        
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">WIF Format Explained</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Testnet Keys</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Used for development and testing. Addresses start with <code>m</code> or <code>n</code>.
                </p>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Mainnet Keys</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Used for real transactions. Addresses start with <code>1</code>, <code>3</code>, or <code>bc1</code>.
                </p>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  L34utF8ADEqe7JvLxCAGReNMwEreNRdzLPPP55WwTdL2zmHyu2MQ
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Security Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-green-600">✅ Do This</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use testnet keys for development</li>
                  <li>• Store keys in environment variables</li>
                  <li>• Use hardware wallets for production</li>
                  <li>• Generate keys programmatically</li>
                  <li>• Validate keys before use</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-red-600">❌ Don't Do This</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Commit private keys to Git</li>
                  <li>• Share keys in logs or screenshots</li>
                  <li>• Use mainnet keys for testing</li>
                  <li>• Use online generators for real funds</li>
                  <li>• Store keys in plain text files</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 