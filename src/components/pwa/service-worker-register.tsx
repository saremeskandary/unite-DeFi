"use client"

import { useEffect, useState } from 'react'

export function ServiceWorkerRegister() {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        // Mark as hydrated after first render
        setIsHydrated(true)
    }, [])

    useEffect(() => {
        // Only register service worker after hydration is complete
        if (!isHydrated) return

        if ('serviceWorker' in navigator) {
            // Use a small delay to ensure DOM is fully ready
            const timer = setTimeout(() => {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then((registration) => {
                            console.log('SW registered: ', registration);
                        })
                        .catch((registrationError) => {
                            console.log('SW registration failed: ', registrationError);
                        });
                });
            }, 100)

            return () => clearTimeout(timer)
        }
    }, [isHydrated]);

    return null;
} 