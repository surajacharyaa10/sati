"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  Currency,
  formatPrice,
  formatRupees,
  formatPounds,
  getProductPriceInfo,
  type PricingProduct,
  type ProductPriceInfo,
} from "./currency"

import { useAuth } from "@/app/components/auth-provider"

interface CurrencyContextValue {
  currency: Currency
  setCurrency: (c: Currency) => void
  toggleCurrency: () => void
  format: (amount: number, curr?: Currency) => string
  getPriceInfo: (product: PricingProduct) => ProductPriceInfo
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NPR",
  setCurrency: () => {},
  toggleCurrency: () => {},
  format: (amount: number) => formatRupees(amount),
  getPriceInfo: (product: PricingProduct) => getProductPriceInfo(product, "NPR"),
})

const STORAGE_KEY = "sati_currency"

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currency, setCurrencyState] = useState<Currency>("NPR")

  useEffect(() => {
    if (user?.country === "UK" || user?.currency === "GBP") {
      setCurrencyState("GBP")
      return
    }
    if (user?.country === "Nepal" || user?.currency === "NPR") {
      setCurrencyState("NPR")
      return
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "GBP" || saved === "NPR") {
        setCurrencyState(saved)
      }
    } catch {
      // LocalStorage might be restricted
    }
  }, [user?.country, user?.currency])

  function setCurrency(c: Currency) {
    setCurrencyState(c)
    try {
      localStorage.setItem(STORAGE_KEY, c)
    } catch {
      // Ignore
    }
  }

  function toggleCurrency() {
    setCurrency(currency === "NPR" ? "GBP" : "NPR")
  }

  function format(amount: number, curr?: Currency): string {
    return formatPrice(amount, curr || currency)
  }

  function getPriceInfo(product: PricingProduct): ProductPriceInfo {
    return getProductPriceInfo(product, currency)
  }

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        format,
        getPriceInfo,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
