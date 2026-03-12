const HeroCarousel = () => (
  <section className="max-w-[1280px] mx-auto px-6 py-6">
    <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-xl min-h-[360px] flex items-center relative overflow-hidden">
      <div className="p-8 md:p-12 max-w-full md:max-w-[50%] z-10 text-primary-foreground">
        <span className="inline-block bg-primary px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
          Tech Week
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-[1.1] mb-4">
          Big Tech Sale —<br />Up to 60% OFF!
        </h1>
        <p className="text-lg opacity-90 mb-8">
          Upgrade your setup with the latest gear. Limited time offers on top brands.
        </p>
        <button className="bg-background text-foreground px-6 py-3 rounded-lg font-bold text-sm vm-transition hover:-translate-y-0.5 hover:shadow-lg">
          Shop the Sale
        </button>
      </div>
      <div className="hidden md:flex absolute right-12 top-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/10 rounded-xl justify-center items-center text-6xl backdrop-blur-sm outline outline-1 outline-white/20 -outline-offset-1">
        📷
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-6 h-2 rounded bg-background" />
        <div className="w-2 h-2 rounded-full bg-white/30" />
        <div className="w-2 h-2 rounded-full bg-white/30" />
      </div>
    </div>
  </section>
);

export default HeroCarousel;
