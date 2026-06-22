"use client";
import { useRouter } from "next/navigation";
import { useRef } from "react";

export interface CategoryTab {
  slug: string;
  label: string;
  thaiName: string | null;
}

interface Props {
  categories: readonly CategoryTab[];
  activeSlug: string;
}

export default function CategoryFilterBar({ categories, activeSlug }: Props) {
  const router = useRouter();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleSelect = (slug: string) => {
    if (slug === "all") router.push("/news");
    else router.push(`/news?category=${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % categories.length;
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + categories.length) % categories.length;
      tabRefs.current[prev]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(categories[index].slug);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="News categories"
      className="flex gap-1 overflow-x-auto py-1 mb-4"
    >
      {categories.map((cat, i) => {
        const isActive = cat.slug === activeSlug;
        return (
          <button
            key={cat.slug}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(cat.slug)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className="flex-shrink-0 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={
              isActive
                ? {
                    backgroundColor: "#4A342A",
                    color: "#D7C9B8",
                    borderColor: "#4A342A",
                  }
                : {
                    backgroundColor: "white",
                    color: "#4A342A",
                    borderColor: "rgba(74,52,42,0.2)",
                  }
            }
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
