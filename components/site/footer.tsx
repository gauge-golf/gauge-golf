import Image from "next/image";
import { Youtube, Instagram, Facebook, Mail, MessageCircle } from "lucide-react";
import { getMessages, localeHref, type Locale } from "@/lib/i18n";

// TikTok inline (lucide TikTok deprecated)
function TikTok({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20 8.5a6.6 6.6 0 0 1-4-1.4v7.7a5.7 5.7 0 1 1-5-5.6v2.7a3 3 0 1 0 2.2 2.9V2.5h2.8a3.8 3.8 0 0 0 4 3.4v2.6z" />
    </svg>
  );
}

const socials = [
  { Icon: Youtube,        href: "https://youtube.com/@gauge-golf",        label: "YouTube" },
  { Icon: Instagram,      href: "https://www.instagram.com/kosta_golf",   label: "Instagram" },
  { Icon: TikTok,         href: "https://www.tiktok.com/@kazarichuk",     label: "TikTok" },
  { Icon: Facebook,       href: "https://www.facebook.com/share/18iQdmxpL7/", label: "Facebook" },
  { Icon: MessageCircle,  href: "https://wa.me/6281225290989",            label: "WhatsApp" },
  { Icon: Mail,           href: "mailto:hello@gauge-golf.com",            label: "Email" },
];

export function Footer({ locale = "en" }: { locale?: Locale }) {
  const t = getMessages(locale).footer;
  return (
    <footer className="border-t border-white/10 px-0 pb-10 pt-16">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-14">
          <div>
            <Image
              src="/media/logo-main-gauge.svg"
              alt="Gauge Golf"
              width={280}
              height={80}
              className="mb-5 h-auto w-[200px] md:w-[280px]"
            />
            <p className="max-w-[36ch] text-white/60">
              {t.tagline_line1}<br />{t.tagline_line2}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-white/20 text-white transition hover:border-gold hover:text-gold"
                >
                  <Icon className="size-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h5 className="m-0 mb-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">{t.h_nav}</h5>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {[
                [localeHref(locale, "/#story"),   t.nav_story],
                [localeHref(locale, "/#product"), t.nav_product],
                [localeHref(locale, "/#testing"), t.nav_testing],
                [localeHref(locale, "/#access"),  t.nav_access],
                [localeHref(locale, "/#faq"),     t.nav_faq],
              ].map(([h, l]) => (
                <li key={h}><a href={h} className="font-display text-sm font-semibold hover:text-gold">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="m-0 mb-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">{t.h_contact}</h5>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li><a href="mailto:hello@gauge-golf.com" className="font-display text-sm font-semibold hover:text-gold">hello@gauge-golf.com</a></li>
              <li><a href="https://wa.me/6281225290989" target="_blank" rel="noopener noreferrer" className="font-display text-sm font-semibold hover:text-gold">+62 812 2529 0989 · WhatsApp</a></li>
              <li><a href="https://www.instagram.com/kosta_golf" target="_blank" rel="noopener noreferrer" className="font-display text-sm font-semibold hover:text-gold">@kosta_golf · Instagram</a></li>
              <li><a href="https://www.tiktok.com/@kazarichuk" target="_blank" rel="noopener noreferrer" className="font-display text-sm font-semibold hover:text-gold">@kazarichuk · TikTok</a></li>
              <li><a href="https://youtube.com/@gauge-golf" target="_blank" rel="noopener noreferrer" className="font-display text-sm font-semibold hover:text-gold">@gauge-golf · YouTube</a></li>
            </ul>
          </div>

          <div>
            <h5 className="m-0 mb-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">{t.h_legal}</h5>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {[
                ["/privacy",  t.legal_privacy],
                ["/terms",    t.legal_terms],
                ["/shipping", t.legal_shipping],
                ["/refunds",  t.legal_refunds],
                ["/imprint",  t.legal_imprint],
              ].map(([h, l]) => (
                <li key={h}><a href={h} className="font-display text-sm font-semibold hover:text-gold">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
          <span>{t.copyright}</span>
          <a href="mailto:hello@gauge-golf.com" className="hover:text-gold">hello@gauge-golf.com</a>
        </div>
      </div>
    </footer>
  );
}
