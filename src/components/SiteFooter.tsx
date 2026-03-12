import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const productLinks = [
  { label: "Tower Speakers", to: "/products/tower-speakers" },
  { label: "Home Theatre", to: "/products/home-theatre-systems" },
  { label: "Car Audio", to: "/products/car-audio" },
  { label: "DTH Receivers", to: "/products/dth-receivers" },
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
  <footer className="py-10 md:py-16 pb-6 md:pb-8 border-t border-border">
    <div className="max-w-[1280px] mx-auto px-4 md:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)] gap-6 lg:gap-12 mb-8 md:mb-12">
        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="block mb-3 md:mb-4">
            <img src={`${import.meta.env.BASE_URL}unitech-logo.png`} alt="Unitech India" className="h-8 md:h-9 w-auto" />
          </Link>
          <p className="text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 max-w-[250px]">
            Manufacturing premium audio equipment and electronics since 1999. Trusted by professionals across India.
          </p>
          <div className="flex gap-3 mt-4 md:mt-5">
            <a href="https://www.facebook.com/Unitechindia.net/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-9 md:h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-colors">
              <Facebook className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
            </a>
            <a href="https://www.instagram.com/unitechindiaofficial/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-9 md:h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-colors">
              <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
            </a>
            <a href="https://x.com/UNITECH_INDIA" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-9 md:h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-colors">
              <Twitter className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
            </a>
            <a href="https://youtube.com/@unitechindia8273?si=nW4NphKv4yiEtmn4" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-9 md:h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground transition-colors">
              <Youtube className="w-3.5 h-3.5 md:w-4 md:h-4" strokeWidth={1.5} />
            </a>
          </div>
          <div className="mt-5 md:mt-6 space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
              <span>unitechindia@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
              <span>Customer Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
              <span>Pan-India Delivery</span>
            </div>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="font-bold text-sm md:text-base mb-3 md:mb-5">{col.title}</h5>
            <ul className="flex flex-col gap-2 md:gap-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-xs md:text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center pt-6 md:pt-8 border-t border-border text-xs md:text-sm text-muted-foreground">
        © {new Date().getFullYear()} Unitech India. All rights reserved. Expand Your Life.
      </div>
    </div>
  </footer>
);

export default SiteFooter;
