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
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 flex items-center justify-between h-[56px] md:h-[60px] gap-3">
        {/* Left – badge + headline (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8251a] text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
            <Rocket className="w-3 h-3" />
            Official Launch
          </span>
          <span className="text-white/80 text-xs font-medium">
            Unitech Shop Launches <span className="text-white font-semibold">1st May 2026</span>
          </span>
        </div>

        {/* Center – countdown */}
        <div className="flex items-center gap-1.5 md:gap-2 mx-auto md:mx-0">
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
            className="hidden md:inline-flex items-center px-3 py-1.5 bg-[#e8251a] hover:bg-[#c71f16] text-white text-[11px] font-bold rounded-md transition-colors"
          >
            Explore Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default LaunchCountdown;
