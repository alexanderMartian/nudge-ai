import Hero from "@/components/sections/Hero";
import Customers from "@/components/sections/Customers";
import Features from "@/components/sections/Features";
import Pricing from "@/components/sections/Pricing";
import Waitlist from "@/components/sections/Waitlist";

export default function Home() {
  return (
    <main>
      <Hero />
      <Customers />
      <Features />
      <Pricing />
      <Waitlist />
    </main>
  );
}
