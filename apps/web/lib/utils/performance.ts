/**
 * Performance utilities for optimizing the application
 */

/**
 * Delays the import of a module until it's needed
 * Useful for code-splitting heavy components
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = React.lazy(factory)
  let factoryPromise: Promise<{ default: T }> | undefined
  let Component: T | undefined

  return Object.assign(LazyComponent, {
    preload() {
      if (!factoryPromise) {
        factoryPromise = factory()
        factoryPromise.then((module) => {
          Component = module.default
        })
      }
      return factoryPromise
    },
  })
}

/**
 * Debounce function for performance optimization
 * Delays execution until after wait milliseconds have elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for performance optimization
 * Ensures function is only called once per specified time period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Check if code is running on client side
 */
export const isClient = typeof window !== 'undefined'

/**
 * Check if code is running on server side
 */
export const isServer = typeof window === 'undefined'

/**
 * Get performance metrics (only works on client)
 */
export function getPerformanceMetrics() {
  if (!isClient || !window.performance) return null

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!navigation) return null

  return {
    // Time to First Byte
    ttfb: navigation.responseStart - navigation.requestStart,
    // DOM Content Loaded
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    // Load Complete
    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
    // Total Load Time
    totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
  }
}

/**
 * Log performance metrics to console (development only)
 */
export function logPerformanceMetrics() {
  if (process.env.NODE_ENV !== 'development') return

  const metrics = getPerformanceMetrics()
  if (metrics) {
    console.table(metrics)
  }
}

/**
 * Preload an image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export async function preloadImages(srcs: string[]): Promise<void[]> {
  return Promise.all(srcs.map(preloadImage))
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (!isClient) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get connection speed
 */
export function getConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
  if (!isClient) return 'unknown'

  // @ts-ignore - NetworkInformation API is not in TypeScript types yet
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return 'unknown'

  const effectiveType = connection.effectiveType

  if (effectiveType === '4g') return 'fast'
  if (effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') return 'slow'

  return 'unknown'
}

/**
 * Detect if device is mobile
 */
export function isMobileDevice(): boolean {
  if (!isClient) return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// React import for lazy loading
import React from 'react'
