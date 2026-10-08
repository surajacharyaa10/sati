const rupeeFormatter = new Intl.NumberFormat("en-NP", {
  maximumFractionDigits: 0,
})

export function formatRupees(amount: number) {
  return `Rs ${rupeeFormatter.format(amount)}`
}