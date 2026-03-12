const columns = [
  { title: "VoltMart", links: ["About Us", "Careers", "Blog", "Press"] },
  { title: "Buy", links: ["Payment Methods", "Shipping & Delivery", "Returns & Refunds", "VoltMart Guarantee"] },
  { title: "Sell", links: ["Open a Store", "Seller Center", "Advertising", "Partner Program"] },
  { title: "Guide & Help", links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"] },
];

const SiteFooter = () => (
  <footer className="py-16 pb-8 border-t border-border">
    <div className="max-w-[1280px] mx-auto px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)] gap-8 lg:gap-12 mb-12">
        <div>
          <a href="#" className="text-2xl font-extrabold text-primary tracking-[-0.04em]">VoltMart</a>
          <p className="text-sm text-muted-foreground mt-4 max-w-[250px]">
            The premier destination for authentic electronics, gadgets, and smart home technology.
          </p>
          <div className="flex gap-4 mt-4 text-xl">
            <a href="#" className="hover:text-primary vm-transition">𝕏</a>
            <a href="#" className="hover:text-primary vm-transition">📸</a>
            <a href="#" className="hover:text-primary vm-transition">📘</a>
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
        © 2023 VoltMart. All rights reserved. Designed with precision.
      </div>
    </div>
  </footer>
);

export default SiteFooter;
