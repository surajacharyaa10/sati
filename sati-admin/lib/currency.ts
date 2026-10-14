"use client"

import { useState, useEffect } from "react"

const RATE_CACHE_KEY = "sati_admin_gbp_npr_rate"
const RATE_CACHE_TIME_KEY = "sati_admin_gbp_npr_rate_time"
const CACHE_DURATION_MS = 30 * 60 * 1000 // 30 minutes cache

// Sensible fallback if network or API is down
export const DEFAULT_GBP_NPR_RATE = 200.0

let inMemoryRate: number | null = null

export async function fetchLiveExchangeRate(): Promise<number> {
  if (typeof window !== "undefined") {
    // Check localStorage cache
    try {
      const cached = localStorage.getItem(RATE_CACHE_KEY)
      const cachedTime = localStorage.getItem(RATE_CACHE_TIME_KEY)
      if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_DURATION_MS) {
        const parsed = parseFloat(cached)
        if (!isNaN(parsed) && parsed > 0) {
          inMemoryRate = parsed
          return parsed
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  if (inMemoryRate) return inMemoryRate

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/GBP")
    if (!res.ok) throw new Error("Exchange rate fetch failed")
    const data = await res.json()
    const liveRate = data?.rates?.NPR

    if (typeof liveRate === "number" && liveRate > 0) {
      inMemoryRate = liveRate
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(RATE_CACHE_KEY, String(liveRate))
          localStorage.setItem(RATE_CACHE_TIME_KEY, String(Date.now()))
        } catch {
          // Ignore storage quota
        }
      }
      return liveRate
    }
  } catch (err) {
    console.warn("Could not fetch live exchange rate, using fallback:", err)
  }

  return inMemoryRate || DEFAULT_GBP_NPR_RATE
}

export function useExchangeRate() {
  const [rate, setRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(RATE_CACHE_KEY)
        if (cached) {
          const val = parseFloat(cached)
          if (!isNaN(val) && val > 0) return val
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_GBP_NPR_RATE
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchLiveExchangeRate().then((r) => {
      if (mounted) {
        setRate(r)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return { rate, loading }
}

export function convertGbpToNpr(gbp: number, rate: number): number {
  return Math.round(gbp * rate * 100) / 100
}

export function convertNprToGbp(npr: number, rate: number): number {
  if (rate <= 0) return 0
  return Math.round((npr / rate) * 100) / 100
}

export function formatPound(amount: number): string {
  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatRupee(amount: number): string {
  return `Rs ${Math.round(amount).toLocaleString("en-NP")}`
}

/**
 * Returns formatted prices for dual display:
 * always Pound (£) on top and Rupee (Rs) on the bottom.
 */
export function getDualAmount(
  params: {
    gbp?: number | null
    npr?: number | null
  },
  rate: number,
): { gbpFormatted: string; nprFormatted: string; gbpVal: number; nprVal: number } {
  let gbpVal = 0
  let nprVal = 0

  if (params.gbp != null && params.gbp > 0) {
    gbpVal = params.gbp
    nprVal = params.npr != null && params.npr > 0 ? params.npr : convertGbpToNpr(gbpVal, rate)
  } else if (params.npr != null && params.npr > 0) {
    nprVal = params.npr
    gbpVal = convertNprToGbp(nprVal, rate)
  }

  return {
    gbpFormatted: formatPound(gbpVal),
    nprFormatted: formatRupee(nprVal),
    gbpVal,
    nprVal,
  }
}
