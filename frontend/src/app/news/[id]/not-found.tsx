import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="max-w-3xl mx-auto px-4 py-16 text-center"
    >
      <h1 className="text-lg font-bold mb-4" style={{ color: "#4A342A" }}>
        Article not found.
      </h1>
      <Link
        href="/news"
        className="text-sm font-medium hover:underline"
        style={{ color: "#B2967D" }}
      >
        ← Back to News
      </Link>
    </main>
  );
}
