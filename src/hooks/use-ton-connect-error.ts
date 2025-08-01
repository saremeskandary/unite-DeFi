import { useEffect, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { toast } from "sonner";

interface TONConnectError {
  type: "manifest" | "network" | "wallet" | "unknown";
  message: string;
  timestamp: Date;
  details?: any;
}

export function useTONConnectError() {
  const [tonConnectUI] = useTonConnectUI();
  const [errors, setErrors] = useState<TONConnectError[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check manifest accessibility
    const checkManifest = async () => {
      setIsChecking(true);
      try {
        const isLocalhost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        const env = isLocalhost ? "development" : "production";

        const response = await fetch(`/api/ton/manifest?env=${env}`);
        const data = await response.json();

        if (!response.ok) {
          const error: TONConnectError = {
            type: "manifest",
            message: "Manifest file not accessible",
            timestamp: new Date(),
            details: data,
          };
          setErrors((prev) => [...prev, error]);
          toast.error(
            "TON Connect manifest not accessible. Please check configuration."
          );
        }
      } catch (error) {
        const errorObj: TONConnectError = {
          type: "network",
          message: "Failed to check manifest accessibility",
          timestamp: new Date(),
          details: error,
        };
        setErrors((prev) => [...prev, errorObj]);
        toast.error("Network error while checking TON Connect configuration.");
      } finally {
        setIsChecking(false);
      }
    };

    // Listen for global errors
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage =
        event.error?.message || event.message || "Unknown error";

      let errorType: TONConnectError["type"] = "unknown";
      if (
        errorMessage.includes("manifest") ||
        errorMessage.includes("tonconnect")
      ) {
        errorType = "manifest";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        errorType = "network";
      } else if (
        errorMessage.includes("wallet") ||
        errorMessage.includes("tonkeeper")
      ) {
        errorType = "wallet";
      }

      const error: TONConnectError = {
        type: errorType,
        message: errorMessage,
        timestamp: new Date(),
        details: event.error,
      };

      setErrors((prev) => [...prev, error]);
    };

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMessage =
        event.reason?.message || "Unhandled promise rejection";

      let errorType: TONConnectError["type"] = "unknown";
      if (
        errorMessage.includes("manifest") ||
        errorMessage.includes("tonconnect")
      ) {
        errorType = "manifest";
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        errorType = "network";
      } else if (
        errorMessage.includes("wallet") ||
        errorMessage.includes("tonkeeper")
      ) {
        errorType = "wallet";
      }

      const error: TONConnectError = {
        type: errorType,
        message: errorMessage,
        timestamp: new Date(),
        details: event.reason,
      };

      setErrors((prev) => [...prev, error]);
    };

    // Set up error listeners
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Check manifest on mount
    checkManifest();

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, [tonConnectUI]);

  const clearErrors = () => {
    setErrors([]);
  };

  const getLatestError = () => {
    return errors.length > 0 ? errors[errors.length - 1] : null;
  };

  const getErrorsByType = (type: TONConnectError["type"]) => {
    return errors.filter((error) => error.type === type);
  };

  return {
    errors,
    isChecking,
    clearErrors,
    getLatestError,
    getErrorsByType,
  };
}
