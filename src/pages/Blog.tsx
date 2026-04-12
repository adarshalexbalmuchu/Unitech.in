import TopBar from "@/components/TopBar";
import StickyHeader from "@/components/StickyHeader";
import SiteFooter from "@/components/SiteFooter";
import { Link } from "react-router-dom";
import { Newspaper, ArrowLeft } from "lucide-react";

const Blog = () => (
  <div className="min-h-screen bg-background">
    <TopBar />
    <StickyHeader />

    <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-20 md:py-28">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        {/* Icon */}
        <div
          className="flex items-center justify-center rounded-2xl mb-6"
          style={{ width: 72, height: 72, background: "rgba(232,37,26,0.08)" }}
        >
          <Newspaper className="w-8 h-8 text-[#e8251a]" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          Blog
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-2">
          We're working on something exciting!
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          Tips, guides, product spotlights, and audio insights — coming&nbsp;soon.
        </p>

        {/* Badge */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold mb-8"
          style={{ background: "rgba(232,160,32,0.12)", color: "#e8a020", border: "1px solid rgba(232,160,32,0.25)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8a020] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8a020]" />
          </span>
          Coming Soon
        </span>

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>

    <SiteFooter />
  </div>
);

export default Blog;
