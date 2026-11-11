import Reveal from "@/components/ui/Reveal";

export default function Customers() {
  return (
    <section id="customers" aria-label="Customers" className="px-5 pt-14 pb-6">
      <Reveal className="max-w-[1200px] mx-auto flex flex-col items-center gap-7">
        <p className="text-sm text-muted-foreground">Trusted by teams at</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-muted-foreground">
          {/* Northwind */}
          <div
            role="img"
            aria-label="Northwind"
            className="flex items-center gap-2 text-[19px] font-semibold tracking-[-0.02em]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 20V4l16 16V4" />
            </svg>
            <span aria-hidden="true">Northwind</span>
          </div>

          {/* Lumen */}
          <div
            role="img"
            aria-label="Lumen"
            className="flex items-center gap-2 text-[19px] font-bold tracking-[-0.03em]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span aria-hidden="true">lumen</span>
          </div>

          {/* Arcadia */}
          <div
            role="img"
            aria-label="Arcadia"
            className="flex items-center gap-2 text-[18px] font-medium tracking-[.14em] uppercase"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 20L12 4l9 16z" />
              <path d="M7.5 14h9" />
            </svg>
            <span aria-hidden="true">Arcadia</span>
          </div>

          {/* Helix */}
          <div
            role="img"
            aria-label="Helix"
            className="flex items-center gap-2 text-[20px] font-bold tracking-[-0.02em]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 3c0 6 12 6 12 12s-12 0-12 6" />
              <path d="M18 3c0 6-12 6-12 12" />
            </svg>
            <span aria-hidden="true">Helix</span>
          </div>

          {/* Quanta */}
          <div
            role="img"
            aria-label="Quanta"
            className="flex items-center gap-2 text-[19px] font-semibold italic tracking-[-0.02em]"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" rx="2" />
              <rect x="13" y="13" width="8" height="8" rx="2" />
              <rect x="13" y="3" width="8" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span aria-hidden="true">Quanta</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
