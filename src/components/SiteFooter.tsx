import { Mail, MessageCircle, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const AMBER = "#e8a020";

const pages = [
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "FAQ", to: "/faq" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Blog", to: "/blog" },
];

const socials = [
  { href: "https://www.facebook.com/Unitechindia.net/", Icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/unitechindiaofficial/", Icon: Instagram, label: "Instagram" },
  { href: "https://wa.me/message/YIYEC6DV7OCZK1?src=qr", Icon: MessageCircle, label: "WhatsApp" },
  { href: "https://youtube.com/@unitechindia8273?si=nW4NphKv4yiEtmn4", Icon: Youtube, label: "YouTube" },
];

const SiteFooter = () => (
  <footer className="footer-section" style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
    {/* Main grid */}
    <div
      className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr] gap-10 md:gap-12 px-4 md:px-[60px] pt-12 pb-10"
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
          Est. 1994
        </span>

        {/* Tagline */}
        <p
          className="text-[13px] max-w-[240px]"
          style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginTop: 4 }}
        >
          Premium audio &amp; electronics, trusted across India for over 30&nbsp;years.
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

        {/* WhatsApp */}
        <a
          href="tel:9810448343"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[13px] w-fit transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <span
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" strokeWidth={0}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
          Contact Us
        </a>
      </div>
    </div>

    {/* ── Bottom bar ── */}
    <div
      className="px-4 md:px-[60px] py-3.5"
      style={{
        background: "rgba(0,0,0,0.3)",
        borderTop: "0.5px solid rgba(255,255,255,0.05)",
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
