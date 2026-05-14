import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="relative mx-auto max-w-[760px] px-6 pt-32 pb-20 md:px-10 md:pt-40">
        {children}
      </main>
      <Footer />
    </>
  );
}
