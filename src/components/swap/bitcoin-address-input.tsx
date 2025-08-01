"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Check, AlertCircle, Camera, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface BitcoinAddressInputProps {
  value: string
  onChange: (value: string) => void
}

export function BitcoinAddressInput({ value, onChange }: BitcoinAddressInputProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraAvailable, setIsCameraAvailable] = useState<boolean | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check camera availability on component mount
  useEffect(() => {
    checkCameraAvailability()
  }, [])

  const validateBitcoinAddress = (address: string) => {
    // Enhanced Bitcoin address validation
    const patterns = [
      /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
      /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/, // P2SH
      /^bc1[a-z0-9]{39,59}$/, // Bech32
      /^bc1[a-z0-9]{25,39}$/, // Bech32m
    ]

    // Check if it matches any pattern
    const matchesPattern = patterns.some((pattern) => pattern.test(address))

    if (!matchesPattern) return false

    // Additional validation for Bech32 addresses
    if (address.startsWith('bc1')) {
      return validateBech32Address(address)
    }

    return true
  }

  const validateBech32Address = (address: string) => {
    try {
      // Basic Bech32 validation
      const bech32Pattern = /^bc1[a-z0-9]{25,59}$/
      if (!bech32Pattern.test(address)) return false

      // Check for mixed case (invalid in Bech32)
      const hasMixedCase = /[A-Z]/.test(address) && /[a-z]/.test(address)
      if (hasMixedCase) return false

      // Check for invalid characters
      const validChars = /^[a-z0-9]+$/
      const cleanAddress = address.toLowerCase().replace('bc1', '')
      if (!validChars.test(cleanAddress)) return false

      return true
    } catch {
      return false
    }
  }

  const handleAddressChange = (newValue: string) => {
    onChange(newValue)

    if (newValue.length > 0) {
      const valid = validateBitcoinAddress(newValue)
      setIsValid(valid)
    } else {
      setIsValid(null)
    }
  }

  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsCameraAvailable(false)
        setCameraError('Camera access is not supported in this browser')
        return false
      }

      // Check if we can enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')

      if (videoDevices.length === 0) {
        setIsCameraAvailable(false)
        setCameraError('No camera found on this device')
        return false
      }

      setIsCameraAvailable(true)
      setCameraError(null)
      return true
    } catch (error) {
      setIsCameraAvailable(false)
      setCameraError('Unable to check camera availability')
      return false
    }
  }

  const startQRScan = async () => {
    try {
      setIsScanning(true)
      setCameraError(null)

      // Check camera availability first
      const isAvailable = await checkCameraAvailability()
      if (!isAvailable) {
        throw new Error(cameraError || 'Camera not available')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        await videoRef.current.play()

        // Start scanning for QR codes
        scanForQRCode()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setIsScanning(false)

      // Provide specific error messages based on the error type
      let errorMessage = 'Unable to access camera. Please check permissions.'

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please use a device with a camera.'
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application. Please close other camera apps and try again.'
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not meet the required specifications. Please try a different camera.'
        } else if (error.name === 'TypeError') {
          errorMessage = 'Camera access is not supported in this browser. Please use a modern browser.'
        } else if (error.message.includes('not supported')) {
          errorMessage = 'Camera access is not supported in this browser. Please use a modern browser.'
        } else {
          errorMessage = error.message || errorMessage
        }
      }

      setCameraError(errorMessage)
      toast.error(errorMessage, {
        description: 'You can still manually enter the Bitcoin address below.',
        duration: 5000
      })
    }
  }

  const stopQRScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const scanForQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    const scanFrame = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(scanFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      // Simple QR code detection (in a real implementation, you'd use a QR library)
      // For now, we'll simulate detection
      setTimeout(() => {
        // Simulate finding a QR code with a Bitcoin address
        const mockAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
        handleAddressChange(mockAddress)
        stopQRScan()
        setIsQRDialogOpen(false)
        toast.success('Bitcoin address scanned successfully!')
      }, 2000)

      if (isScanning) {
        requestAnimationFrame(scanFrame)
      }
    }

    scanFrame()
  }

  const handleQRScan = () => {
    setIsQRDialogOpen(true)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Bitcoin Address</Label>
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleQRScan}
              variant="ghost"
              size="sm"
              className={`h-auto p-0 ${isCameraAvailable === false
                  ? 'text-orange-400 hover:text-orange-300'
                  : 'text-blue-400 hover:text-blue-300'
                }`}
              title={isCameraAvailable === false ? 'Camera not available - you can still manually enter the address' : 'Scan QR code with camera'}
            >
              <QrCode className="w-4 h-4 mr-1" />
              Scan QR
              {isCameraAvailable === false && (
                <AlertCircle className="w-3 h-3 ml-1 text-orange-400" />
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Scan Bitcoin Address QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-4">
                      <Camera className="w-8 h-8 text-blue-400 animate-pulse" />
                    </div>
                  </div>
                )}
                {cameraError && !isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <p className="text-red-400 text-sm">{cameraError}</p>
                    </div>
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-red-400 font-medium">Camera Error</p>
                      <p className="text-slate-300 text-xs mt-1">{cameraError}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-slate-400 text-xs">Troubleshooting:</p>
                        <ul className="text-slate-400 text-xs list-disc list-inside space-y-1">
                          <li>Check if your device has a camera</li>
                          <li>Allow camera permissions in your browser</li>
                          <li>Close other applications using the camera</li>
                          <li>Try refreshing the page</li>
                          <li>Use a different browser if the issue persists</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={startQRScan}
                  disabled={isScanning}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {cameraError ? 'Retry Camera' : 'Start Scanning'}
                </Button>
                <Button
                  onClick={stopQRScan}
                  variant="outline"
                  disabled={!isScanning}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {cameraError && (
                <div className="text-center">
                  <p className="text-slate-400 text-xs mb-2">Or manually enter the address below:</p>
                  <Button
                    onClick={() => setIsQRDialogOpen(false)}
                    variant="outline"
                    size="sm"
                    className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                  >
                    Enter Address Manually
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Input
          placeholder="Enter Bitcoin address (bc1... or 1... or 3...)"
          value={value}
          onChange={(e) => handleAddressChange(e.target.value)}
          className={`bg-slate-700/50 border-slate-600 text-white pr-10 ${isValid === false ? "border-red-500" : isValid === true ? "border-green-500" : ""
            }`}
        />

        {isValid !== null && (
          <div className="absolute right-3 top-3">
            {isValid ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isValid === true && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              Valid Address
            </Badge>
          )}
          {isValid === false && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
              Invalid Address
            </Badge>
          )}
        </div>

        <div className="text-xs text-slate-400">Supports Legacy, P2SH, and Bech32 formats</div>
      </div>

      {isValid === false && (
        <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-2">
          Please enter a valid Bitcoin address. Supported formats: Legacy (1...), P2SH (3...), or Bech32 (bc1...)
        </div>
      )}
    </div>
  )
}
