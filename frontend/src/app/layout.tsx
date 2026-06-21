import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import N8nChat from "@/components/N8nChat";
import BottomTabBar from "@/components/BottomTabBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ASK — From news to understanding.",
  description: "ASK (Aware Signals & Knowledge) — รวบรวมข่าวการเงิน วิเคราะห์ผลกระทบต่อหุ้น และสรุปแนวโน้มด้วย AI เพื่อเข้าใจตลาด ไม่ใช่แค่อ่านข่าว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="font-sans antialiased pb-tab-safe lg:pb-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded focus:bg-espresso focus:text-khaki focus:font-bold focus:shadow-[0_0_0_2px_#ffffff,0_0_0_4px_#4A342A]"
        >
          Skip to main content
        </a>
        {children}
        <BottomTabBar />
        <N8nChat />
      </body>
    </html>
  );
}
