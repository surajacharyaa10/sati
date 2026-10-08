import { Footer } from "@/app/components/footer"
import { Navbar } from "@/app/components/navbar"
import { CollectionScreen } from "@/app/components/collection-screen"

export function StoreCollectionPage({
  kind,
}: {
  kind: "arrivals" | "women" | "men" | "sale"
}) {
  return (
    <>
      <Navbar />
      <CollectionScreen kind={kind} />
      <Footer />
    </>
  )
}