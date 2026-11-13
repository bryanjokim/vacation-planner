// SHARED. The top bar from every artboard.
import Link from "next/link";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", padding: "16px 40px", background: "#FFFFFF", borderBottom: "1px solid var(--border)" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", fontFamily: "var(--font-grotesk)", fontWeight: 600, fontSize: 18 }}>
        <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, background: "var(--primary)" }} />
        Trip planner
      </Link>
      {right}
    </header>
  );
}
