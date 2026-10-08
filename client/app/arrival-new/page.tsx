import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { NewArrivalsCatalog } from "@/app/components/new-arrivals-catalog"

export default function NewArrivalsPage() {
  return (
    <>
      <Navbar />
      <NewArrivalsCatalog />
      <Footer />
    </>
  )
}