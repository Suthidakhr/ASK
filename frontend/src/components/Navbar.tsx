"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", sub: "หน้าหลัก", href: "/" },
  { label: "News", sub: "ข่าว", href: "/news" },
  { label: "Trends", sub: "แนวโน้ม", href: "/trends" },
  { label: "About", sub: "เกี่ยวกับ", href: "/about" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="hidden lg:flex sticky top-0 z-50 border-b items-center justify-between px-6 h-14" style={{ backgroundColor: "#4A342A", borderColor: "rgba(215,201,184,0.15)" }}>
      <Link
        href="/"
        className="flex items-center gap-3 focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A] rounded">
        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#D7C9B8" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#4A342A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <div>
          <div className="text-base font-bold tracking-tight text-white leading-none">ASK</div>
          <div className="text-xs leading-none mt-0.5" style={{ color: "rgba(215,201,184,0.55)" }}>From news to understanding.</div>
        </div>
      </Link>

      <nav aria-label="Main navigation">
        <ul className="flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex flex-col items-center px-5 h-14 justify-center border-b-2 transition-all focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
                  style={{
                    borderBottomColor: isActive ? "#D7C9B8" : "transparent",
                    color: isActive ? "#D7C9B8" : "rgba(255,255,255,0.5)",
                  }}>
                  <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                  <span className="text-xs mt-0.5" aria-hidden="true" style={{ color: isActive ? "rgba(215,201,184,0.7)" : "rgba(255,255,255,0.3)" }}>
                    {item.sub}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <div className="text-xs font-mono font-semibold text-white">{time}</div>
          <div className="text-xs mt-0.5" style={{ color: "rgba(215,201,184,0.45)" }}>Bangkok, ICT</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded"
          style={{ backgroundColor: "rgba(215,201,184,0.12)", color: "#D7C9B8", border: "1px solid rgba(215,201,184,0.2)" }}>
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          LIVE
        </div>
      </div>
    </header>
  );
}
