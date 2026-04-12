import { useState } from "react";
import { Mail, MessageCircle, Facebook, Instagram, Youtube, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const AMBER = "#e8a020";

const pageGroups = [
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Blog", to: "/blog" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Shipping", to: "/shipping" },
      { label: "Returns", to: "/returns" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

const socials = [
  { href: "https://www.facebook.com/Unitechindia.net/", Icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/unitechindiaofficial/", Icon: Instagram, label: "Instagram" },
  { href: "https://wa.me/message/YIYEC6DV7OCZK1?src=qr", Icon: MessageCircle, label: "WhatsApp" },
  { href: "https://youtube.com/@unitechindia8273?si=nW4NphKv4yiEtmn4", Icon: Youtube, label: "YouTube" },
];

/* ── Collapsible section for mobile ── */
const FooterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden border-b border-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {title}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: "rgba(255,255,255,0.25)" }}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-60 pb-3" : "max-h-0"}`}>
        {children}
      </div>
    </div>
  );
};

const SiteFooter = () => (
  <footer className="footer-section" style={{ background: "#0d0d0d", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>

    {/* ══ Desktop layout ══ */}
    <div className="hidden md:grid max-w-[1280px] mx-auto grid-cols-[1.6fr_1fr_1fr_1fr] gap-10 px-[60px] pt-12 pb-10">
      {/* Brand column */}
      <div className="flex flex-col gap-4">
        <Link to="/" className="inline-flex items-center w-fit rounded-md" style={{ background: "#fff", padding: "6px 12px" }}>
          <img src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`} alt="Unitech India" className="w-auto" style={{ height: 24 }} />
        </Link>
        <span className="w-fit text-[11px] font-semibold rounded" style={{ color: AMBER, background: "rgba(232,160,32,0.12)", border: `0.5px solid rgba(232,160,32,0.25)`, borderRadius: 4, padding: "3px 8px" }}>
          Est. 1994
        </span>
        <p className="text-[13px] max-w-[240px]" style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginTop: 4 }}>
          Premium audio &amp; electronics, trusted across India for over 30&nbsp;years.
        </p>
        <div className="flex gap-2 mt-2">
          {socials.map(({ href, Icon, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="flex items-center justify-center transition-colors"
              style={{ width: 32, height: 32, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <Icon className="w-[14px] h-[14px]" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.45)" }} />
            </a>
          ))}
        </div>
      </div>

      {/* Page link columns */}
      {pageGroups.map((group) => (
        <div key={group.title} className="flex flex-col" style={{ gap: 10 }}>
          <span className="text-[10px] font-semibold uppercase mb-2" style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
            {group.title}
          </span>
          {group.links.map((p) => (
            <Link key={p.to} to={p.to} className="text-[13px] w-fit transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              {p.label}
            </Link>
          ))}
        </div>
      ))}

      {/* Contact column */}
      <div className="flex flex-col" style={{ gap: 10 }}>
        <span className="text-[10px] font-semibold uppercase mb-2" style={{ letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)" }}>
          Contact
        </span>
        <a href="mailto:unitechindia@gmail.com" className="flex items-center gap-2.5 text-[13px] w-fit transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <span className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
            <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          unitechindia@gmail.com
        </a>
        <a href="tel:9810448343" className="flex items-center gap-2.5 text-[13px] w-fit transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
        >
          <span className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
          Contact Us
        </a>
      </div>
    </div>

    {/* ══ Mobile layout — compact accordion ══ */}
    <div className="md:hidden px-4 pt-8 pb-4">
      {/* Logo + socials row */}
      <div className="flex items-center justify-between mb-5">
        <Link to="/" className="inline-flex items-center rounded-md" style={{ background: "#fff", padding: "5px 10px" }}>
          <img src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`} alt="Unitech India" className="w-auto" style={{ height: 20 }} />
        </Link>
        <div className="flex gap-2">
          {socials.map(({ href, Icon, label }) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="flex items-center justify-center"
              style={{ width: 30, height: 30, background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 6 }}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.45)" }} />
            </a>
          ))}
        </div>
      </div>

      {/* Accordion sections */}
      {pageGroups.map((group) => (
        <FooterSection key={group.title} title={group.title}>
          <div className="flex flex-col gap-2.5 pl-1">
            {group.links.map((p) => (
              <Link key={p.to} to={p.to} className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                {p.label}
              </Link>
            ))}
          </div>
        </FooterSection>
      ))}

      <FooterSection title="Contact">
        <div className="flex flex-col gap-2.5 pl-1">
          <a href="mailto:unitechindia@gmail.com" className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            unitechindia@gmail.com
          </a>
          <a href="tel:9810448343" className="text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            Contact Us
          </a>
        </div>
      </FooterSection>
    </div>

    {/* ── Bottom bar ── */}
    <div className="px-4 md:px-[60px] py-3" style={{ background: "rgba(0,0,0,0.3)", borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          © {new Date().getFullYear()} Unitech India. All rights reserved.
        </p>
        <p className="text-[11px] italic" style={{ color: `rgba(232,160,32,0.6)` }}>
          Unitech hai jahan, Music hai vahan
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
