import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const productLinks = [
  { label: "Tower Speakers", to: "/products/tower-speakers" },
  { label: "Home Theatre", to: "/products/home-theatre-systems" },
  { label: "Car Audio", to: "/products/car-audio" },
  { label: "DTH Receivers", to: "/products/dth-receivers" },
  { label: "Amplifiers", to: "/products/audio-amplifiers" },
];

const supportLinks = [
  { label: "Warranty Info", to: "/warranty" },
  { label: "Contact Us", to: "/contact" },
  { label: "Shipping & Delivery", to: "/shipping" },
  { label: "Returns & Refunds", to: "/returns" },
];

const guideLinks = [
  { label: "Help Center", to: "/help" },
  { label: "FAQ", to: "/faq" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const columns = [
  { title: "Products", links: productLinks },
  { title: "Support", links: supportLinks },
  { title: "Guide & Help", links: guideLinks },
];

const SiteFooter = () => (
  <footer style={{ background: "#111111" }} className="text-white/70">
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 pt-12 md:pt-16 pb-6 md:pb-8">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)] gap-8 md:gap-12 mb-10 md:mb-14">
        {/* Brand column */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="block mb-4">
            <img
              src={`${import.meta.env.BASE_URL}unitech-logo.png?v=2`}
              alt="Unitech India"
              className="h-8 w-auto"
            />
          </Link>
          <p className="text-xs md:text-sm text-white/45 mt-3 max-w-[260px] leading-relaxed">
            Manufacturing premium audio equipment and electronics since 1999. Trusted by
            professionals across India.
          </p>

          {/* Social icons */}
          <div className="flex gap-2.5 mt-5">
            {[
              { href: "https://www.facebook.com/Unitechindia.net/", Icon: Facebook },
              { href: "https://www.instagram.com/unitechindiaofficial/", Icon: Instagram },
              { href: "https://x.com/UNITECH_INDIA", Icon: Twitter },
              { href: "https://youtube.com/@unitechindia8273?si=nW4NphKv4yiEtmn4", Icon: Youtube },
            ].map(({ href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>

          {/* Contact */}
          <div className="mt-6 space-y-2.5 text-xs text-white/40">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>unitechindia@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>Customer Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              <span>Pan-India Delivery</span>
            </div>
          </div>
        </div>

        {/* Link columns */}
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="text-white text-xs font-bold uppercase tracking-widest mb-4 md:mb-5">
              {col.title}
            </h5>
            <ul className="flex flex-col gap-2.5 md:gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-xs md:text-sm text-white/40 hover:text-white/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="pt-6 md:pt-8 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-white/25">
          © {new Date().getFullYear()} Unitech India. All rights reserved.
        </p>
        <p className="text-[11px] text-white/20 italic">
          Unitech hai jahan, Music hai vahan
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
