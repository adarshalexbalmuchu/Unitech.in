import { Phone, Mail, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const AMBER = "#e8a020";

const pages = [
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

const socials = [
  { href: "https://www.facebook.com/Unitechindia.net/", Icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/unitechindiaofficial/", Icon: Instagram, label: "Instagram" },
  { href: "https://x.com/UNITECH_INDIA", Icon: Twitter, label: "X" },
  { href: "https://youtube.com/@unitechindia8273?si=nW4NphKv4yiEtmn4", Icon: Youtube, label: "YouTube" },
];

const SiteFooter = () => (
  <footer style={{ background: "#111" }}>
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-14 pb-0">
      {/* 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-10 md:gap-12 pb-10">

        {/* ── Brand column ── */}
        <div className="flex flex-col gap-5">
          {/* Logo pill */}
          <Link to="/" className="inline-flex items-center gap-2.5 w-fit">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
              style={{ background: AMBER }}
            >
              U
            </div>
            <span
              className="inline-flex items-center gap-2 rounded-md px-3 py-1"
              style={{ border: "0.5px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-sm font-bold tracking-[0.18em] text-white/90 uppercase">
                Unitech
              </span>
            </span>
          </Link>

          {/* Est badge */}
          <span
            className="w-fit text-[10px] font-semibold tracking-wider uppercase rounded-full px-2.5 py-0.5"
            style={{ color: AMBER, border: `0.5px solid ${AMBER}33` }}
          >
            Est. 1999
          </span>

          {/* Tagline */}
          <p className="text-[13px] leading-relaxed text-white/30 max-w-[300px]">
            Premium audio & electronics, trusted across India for over 25&nbsp;years.
          </p>

          {/* Social icons */}
          <div className="flex gap-2 mt-1">
            {socials.map(({ href, Icon, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <Icon className="w-[14px] h-[14px]" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* ── Pages column ── */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-1">
            Pages
          </span>
          {pages.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="text-[13px] text-white/35 hover:text-white/65 transition-colors w-fit"
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* ── Contact column ── */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20 mb-1">
            Contact
          </span>
          <a
            href="mailto:unitechindia@gmail.com"
            className="flex items-center gap-2.5 text-[13px] text-white/35 hover:text-white/65 transition-colors w-fit"
          >
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
            unitechindia@gmail.com
          </a>
          <span className="flex items-center gap-2.5 text-[13px] text-white/35">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
            Customer Support
          </span>
        </div>
      </div>
    </div>

    {/* ── Bottom bar ── */}
    <div style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[11px] text-white/15">
          © {new Date().getFullYear()} Unitech India. All rights reserved.
        </p>
        <p className="text-[11px] italic" style={{ color: `${AMBER}66` }}>
          Unitech hai jahan, Music hai vahan
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
