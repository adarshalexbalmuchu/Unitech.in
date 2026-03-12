import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const columns = [
  { title: "Products", links: ["Tower Speakers", "Home Theatre", "Car Audio", "DTH Receivers"] },
  { title: "Support", links: ["Warranty Info", "Contact Us", "Shipping & Delivery", "Returns & Refunds"] },
  { title: "Guide & Help", links: ["Help Center", "FAQ", "Privacy Policy", "Terms of Service"] },
];

const SiteFooter = () => (
  <footer className="py-16 pb-8 border-t border-border">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(3,1fr)] gap-8 lg:gap-12 mb-12">
        <div>
          <a href="/" className="block mb-4">
            <img src="/unitech-logo.png" alt="Unitech India" className="h-9 w-auto" />
          </a>
          <p className="text-sm text-muted-foreground mt-4 max-w-[250px]">
            Manufacturing premium audio equipment and electronics since 1999. Trusted by professionals across India.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" className="w-9 h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground vm-transition">
              <Facebook className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a href="#" className="w-9 h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground vm-transition">
              <Instagram className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a href="#" className="w-9 h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground vm-transition">
              <Twitter className="w-4 h-4" strokeWidth={1.5} />
            </a>
            <a href="#" className="w-9 h-9 bg-surface hover:bg-primary rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary-foreground vm-transition">
              <Youtube className="w-4 h-4" strokeWidth={1.5} />
            </a>
          </div>
          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span>unitechindia@gmail.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span>Customer Support Available</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span>Pan-India Delivery</span>
            </div>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="font-bold mb-5">{col.title}</h5>
            <ul className="flex flex-col gap-3">
              {col.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary vm-transition">{link}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center pt-8 border-t border-border text-sm text-muted-foreground">
        © 2024 Unitech India. All rights reserved. Expand Your Life.
      </div>
    </div>
  </footer>
);

export default SiteFooter;
