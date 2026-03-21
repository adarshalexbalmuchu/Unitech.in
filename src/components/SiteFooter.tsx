import { Phone, Mail, MessageCircle, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
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
  <footer className="footer-section" style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
    {/* Main grid */}
    <div
      className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-10 md:gap-12"
      style={{ padding: "48px 60px 40px" }}
    >
      {/* ── Column 1 — Brand ── */}
      <div className="flex flex-col gap-4">
        {/* Logo image */}
        <Link to="/" className="inline-flex items-center w-fit rounded-md" style={{ background: "#fff", padding: "6px 12px" }}>
          <img
            src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`}
            alt="Unitech India"
            className="w-auto"
            style={{ height: 24 }}
          />
        </Link>

        {/* Est badge */}
        <span
          className="w-fit text-[11px] font-semibold rounded"
          style={{
            color: AMBER,
            background: "rgba(232,160,32,0.12)",
            border: `0.5px solid rgba(232,160,32,0.25)`,
            borderRadius: 4,
            padding: "3px 8px",
          }}
        >
          Est. 1999
        </span>

        {/* Tagline */}
        <p
          className="text-[13px] max-w-[240px]"
          style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginTop: 4 }}
        >
          Premium audio &amp; electronics, trusted across India for over 25&nbsp;years.
        </p>

        {/* Social icons */}
        <div className="flex gap-2 mt-2">
          {socials.map(({ href, Icon, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 32,
                height: 32,
                background: "rgba(255,255,255,0.05)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <Icon className="w-[14px] h-[14px]" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.45)" }} />
            </a>
          ))}
        </div>
      </div>

      {/* ── Column 2 — Pages ── */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        <span
          className="text-[10px] font-semibold uppercase mb-2"
          style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}
        >
          Pages
        </span>
        {pages.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="text-[13px] w-fit transition-colors"
            style={{ color: "rgba(255,255,255,0.5)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* ── Column 3 — Contact ── */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        <span
          className="text-[10px] font-semibold uppercase mb-2"
          style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}
        >
          Contact
        </span>

        {/* Email */}
        <a
          href="mailto:unitechindia@gmail.com"
          className="flex items-center gap-2.5 text-[13px] w-fit transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
          >
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          unitechindia@gmail.com
        </a>

        {/* Support */}
        <span
          className="flex items-center gap-2.5 text-[13px]"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
          >
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          Customer Support
        </span>

        {/* Phone — placeholder */}
        <span
          className="flex items-center gap-2.5 text-[13px]"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
          >
            <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          {/* TODO: Add phone number here */}
          Add phone number here
        </span>
      </div>
    </div>

    {/* ── Bottom bar ── */}
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        borderTop: "0.5px solid rgba(255,255,255,0.05)",
        padding: "14px 60px",
      }}
    >
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} Unitech India. All rights reserved.
        </p>
        <p className="text-[12px] italic" style={{ color: `rgba(232,160,32,0.6)` }}>
          Unitech hai jahan, Music hai vahan
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
