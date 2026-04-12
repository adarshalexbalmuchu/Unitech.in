import { useEffect, useState, useRef } from "react";
import { Rocket } from "lucide-react";

const LAUNCH_DATE = new Date("2026-05-01T00:00:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(): TimeLeft | null {
  const diff = LAUNCH_DATE.getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const prev = useRef(value);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlip(true);
      prev.current = value;
      const id = setTimeout(() => setFlip(false), 300);
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={`
          inline-flex items-center justify-center
          min-w-[2rem] md:min-w-[2.5rem] h-7 md:h-8
          bg-white/15 backdrop-blur-sm rounded-md
          text-white font-mono text-sm md:text-base font-bold
          tabular-nums transition-transform duration-300
          ${flip ? "scale-y-90" : "scale-y-100"}
        `}
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] md:text-[10px] text-white/60 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

const LaunchCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (!t) clearInterval(id);
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!timeLeft) return null;

  return (
    <div className="w-full bg-[#111] border-b border-white/10">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-auto py-2.5 md:h-[60px] md:py-0 gap-2 md:gap-3 flex-wrap md:flex-nowrap">
        {/* Left – badge + headline */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 bg-[#e8251a] text-white text-[9px] md:text-[10px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap">
            <Rocket className="w-2.5 h-2.5 md:w-3 md:h-3" />
            Launch
          </span>
          <span className="text-white/80 text-[11px] md:text-xs font-medium">
            Unitech Shop — <span className="text-white font-semibold">1st May 2026</span>
          </span>
        </div>

        {/* Center – countdown */}
        <div className="flex items-center gap-1.5 md:gap-2 md:mx-0 order-3 md:order-none w-full md:w-auto justify-center md:justify-start">
          <FlipDigit value={timeLeft.days} label="Days" />
          <span className="text-white/40 font-bold text-sm md:text-base mt-[-10px]">:</span>
          <FlipDigit value={timeLeft.hours} label="Hrs" />
          <span className="text-white/40 font-bold text-sm md:text-base mt-[-10px]">:</span>
          <FlipDigit value={timeLeft.minutes} label="Min" />
          <span className="text-white/40 font-bold text-sm md:text-base mt-[-10px]">:</span>
          <FlipDigit value={timeLeft.seconds} label="Sec" />
        </div>

        {/* Right – CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/products/all"
            className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 bg-[#e8251a] hover:bg-[#c71f16] text-white text-[10px] md:text-[11px] font-bold rounded-md transition-colors"
          >
            Explore
          </a>
        </div>
      </div>
    </div>
  );
};

export default LaunchCountdown;
