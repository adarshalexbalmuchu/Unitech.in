import { Phone, Mail, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

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
  <footer style={{ background: "#111111" }} className="text-white/50">
    <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-14 pb-8">

      {/* Top section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-10">

        {/* Brand */}
        <div className="flex flex-col gap-4 max-w-[260px]">
          <Link to="/">
            <img
              src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`}
              alt="Unitech India"
              className="h-8 w-auto"
            />
          </Link>
          <p className="text-xs text-white/35 leading-relaxed">
            Premium audio & electronics since 1999. Trusted across India.
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
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 text-white/35 hover:text-white hover:border-white/30 transition-colors"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {/* Pages */}
        <div className="flex flex-col gap-2">
          <h5 className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-1">Pages</h5>
          {pages.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="text-xs text-white/35 hover:text-white/70 transition-colors"
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h5 className="text-white/70 text-[11px] font-semibold uppercase tracking-widest mb-1">Contact</h5>
          <a
            href="mailto:unitechindia@gmail.com"
            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/70 transition-colors"
          >
            <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            unitechindia@gmail.com
          </a>
          <a
            href="tel:+911234567890"
            className="flex items-center gap-2 text-xs text-white/35 hover:text-white/70 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            Customer Support
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.07]" />

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6">
        <p className="text-[11px] text-white/20">
          © {new Date().getFullYear()} Unitech India. All rights reserved.
        </p>
        <p className="text-[11px] text-white/15 italic">
          Unitech hai jahan, Music hai vahan
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
