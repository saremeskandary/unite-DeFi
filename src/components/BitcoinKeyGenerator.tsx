'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Copy, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { BitcoinKeyGenerator } from '@/lib/bitcoin-key-generator';

interface GeneratedKey {
  privateKeyWIF: string;
  publicKey: string;
  address: string;
  network: string;
}

export function BitcoinKeyGeneratorComponent() {
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    network: string;
    address?: string;
    error?: string;
  } | null>(null);
  const [wifToValidate, setWifToValidate] = useState('');
  const [hexToConvert, setHexToConvert] = useState('');
  const [conversionNetwork, setConversionNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  const generateKey = async (useTestnet: boolean = true) => {
    setIsGenerating(true);
    try {
      const key = BitcoinKeyGenerator.generateWIFKeyPair(useTestnet);
      setGeneratedKey(key);
    } catch (error) {
      console.error('Error generating key:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const validateWIF = () => {
    if (!wifToValidate.trim()) {
      setValidationResult({
        isValid: false,
        network: 'unknown',
        error: 'Please enter a WIF key to validate'
      });
      return;
    }

    const result = BitcoinKeyGenerator.validateWIF(wifToValidate.trim());
    setValidationResult(result);
  };

  const convertHexToWIF = () => {
    if (!hexToConvert.trim()) {
      setValidationResult({
        isValid: false,
        network: 'unknown',
        error: 'Please enter a hex private key to convert'
      });
      return;
    }

    try {
      const result = BitcoinKeyGenerator.hexToWIF(hexToConvert.trim(), conversionNetwork === 'testnet');
      setGeneratedKey(result);
      setValidationResult(null);
    } catch (error) {
      setValidationResult({
        isValid: false,
        network: 'unknown',
        error: error instanceof Error ? error.message : 'Invalid hex private key'
      });
    }
  };

  const getCopyButton = (text: string, field: string) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="ml-2"
    >
      {copiedField === field ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-6 w-6" />
            Bitcoin WIF Key Generator
          </CardTitle>
          <CardDescription>
            Generate Bitcoin private keys in WIF format for use with the 1inch Fusion+ integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate Keys</TabsTrigger>
              <TabsTrigger value="validate">Validate WIF</TabsTrigger>
              <TabsTrigger value="convert">Convert Hex</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => generateKey(true)}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Testnet Key
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => generateKey(false)}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Generate Mainnet Key
                    </>
                  )}
                </Button>
              </div>

              {generatedKey && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Private Key (WIF)</Label>
                    {getCopyButton(generatedKey.privateKeyWIF, 'wif')}
                  </div>
                  <Input
                    value={generatedKey.privateKeyWIF}
                    readOnly
                    className="font-mono text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Public Key</Label>
                    {getCopyButton(generatedKey.publicKey, 'public')}
                  </div>
                  <Input
                    value={generatedKey.publicKey}
                    readOnly
                    className="font-mono text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Address</Label>
                    {getCopyButton(generatedKey.address, 'address')}
                  </div>
                  <Input
                    value={generatedKey.address}
                    readOnly
                    className="font-mono text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Network</Label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      generatedKey.network === 'testnet' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {generatedKey.network}
                    </span>
                  </div>
                </div>
              )}

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription>
                  <strong>Security Note:</strong> 
                  <ul className="mt-2 list-disc list-inside text-sm">
                    <li>Use testnet keys for development and testing</li>
                    <li>Never share or commit private keys to version control</li>
                    <li>Store keys securely in environment variables</li>
                    <li>Use hardware wallets for production with real funds</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="validate" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wifInput">WIF Private Key to Validate</Label>
                <div className="flex gap-2">
                  <Input
                    id="wifInput"
                    value={wifToValidate}
                    onChange={(e) => setWifToValidate(e.target.value)}
                    placeholder="Enter WIF private key (e.g., cQAPyLxx84YtechDcCtsgzmboC7zk5gmM6sxdN6qErs3AqQow2hC)"
                    className="font-mono"
                  />
                  <Button onClick={validateWIF}>Validate</Button>
                </div>
              </div>

              {validationResult && (
                <Alert className={`${
                  validationResult.isValid 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription>
                      <div className="font-semibold">
                        {validationResult.isValid ? 'Valid WIF Key' : 'Invalid WIF Key'}
                      </div>
                      {validationResult.isValid ? (
                        <div className="mt-2 space-y-1 text-sm">
                          <div><strong>Network:</strong> {validationResult.network}</div>
                          {validationResult.address && (
                            <div><strong>Address:</strong> {validationResult.address}</div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm">
                          <strong>Error:</strong> {validationResult.error}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="convert" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hexInput">Hex Private Key to Convert</Label>
                <Input
                  id="hexInput"
                  value={hexToConvert}
                  onChange={(e) => setHexToConvert(e.target.value)}
                  placeholder="Enter 64-character hex private key"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>Target Network</Label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="testnet"
                      checked={conversionNetwork === 'testnet'}
                      onChange={(e) => setConversionNetwork(e.target.value as 'testnet' | 'mainnet')}
                    />
                    <span>Testnet</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="mainnet"
                      checked={conversionNetwork === 'mainnet'}
                      onChange={(e) => setConversionNetwork(e.target.value as 'testnet' | 'mainnet')}
                    />
                    <span>Mainnet</span>
                  </label>
                </div>
              </div>

              <Button onClick={convertHexToWIF} className="w-full">
                Convert to WIF
              </Button>

              {generatedKey && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Converted WIF Key</Label>
                    {getCopyButton(generatedKey.privateKeyWIF, 'converted')}
                  </div>
                  <Input
                    value={generatedKey.privateKeyWIF}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <div className="text-sm text-gray-600">
                    <div><strong>Address:</strong> {generatedKey.address}</div>
                    <div><strong>Network:</strong> {generatedKey.network}</div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Alert className="mt-6 border-yellow-200 bg-yellow-50">
            <AlertDescription>
              <strong>Environment Variable Setup:</strong>
              <div className="mt-2 text-sm">
                Copy your WIF key to your <code>.env.local</code> file:
                <pre className="mt-1 bg-gray-100 p-2 rounded text-xs">
                  NEXT_PUBLIC_BTC_PRIVATE_KEY_WIF=your_wif_key_here
                </pre>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
} 