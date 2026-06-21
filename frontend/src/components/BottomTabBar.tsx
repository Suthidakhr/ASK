"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabItems = [
  {
    label: "Overview",
    sub: "ภาพรวม",
    href: "/",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "News",
    sub: "ข่าว",
    href: "/news",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2V9c0-1.1.9-2 2-2h2" />
        <line x1="16" y1="8" x2="10" y2="8" />
        <line x1="16" y1="12" x2="10" y2="12" />
        <line x1="16" y1="16" x2="10" y2="16" />
      </svg>
    ),
  },
  {
    label: "Stocks",
    sub: "หุ้น",
    href: "/stocks",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Trends",
    sub: "แนวโน้ม",
    href: "/trends",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Tab bar"
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ backgroundColor: "#4A342A", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex h-14">
        {tabItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center h-full min-h-[44px] border-t-2 transition-colors focus:outline-none focus-visible:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
              style={{
                borderTopColor: isActive ? "#D7C9B8" : "transparent",
                color: isActive ? "#D7C9B8" : "rgba(255,255,255,0.45)",
              }}>
              {item.icon}
              <span className="text-xs font-semibold mt-0.5">{item.label}</span>
              <span className="text-[10px]" aria-hidden="true">{item.sub}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
