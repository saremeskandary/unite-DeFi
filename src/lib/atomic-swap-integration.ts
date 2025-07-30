// Re-export from modular atomic swap implementation
export {
  initiateAtomicSwap,
  completeAtomicSwap,
  monitorSwapProgress,
  handleSwapFailure,
  resetSwapState,
  type SwapParams,
  type SwapResult,
  type SwapActionParams,
  type SwapActionResult,
  type MonitoringParams,
  type MonitoringResult,
  type FailureParams,
  type FailureResult
} from './blockchains/bitcoin/atomic-swap' 