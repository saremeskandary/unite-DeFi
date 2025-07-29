"use client"

import { useState, useEffect } from "react"

export const useIsMobile = (maxWidth = 768) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < maxWidth)
    }

    // Set the initial value
    handleResize()

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [maxWidth])

  return isMobile
}
