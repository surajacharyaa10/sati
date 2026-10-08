import { Navbar } from "./components/navbar";
import Hero from "./components/hero";
import { Footer } from "./components/footer";
import { NewArrivals } from "./components/new-arrivals";
import { ValuesSection } from "./components/values-section";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <NewArrivals />
      <ValuesSection />
      <Footer />
    </>
  );
}