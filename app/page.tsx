import Link from "next/link";
import { modules } from "@/lib/modules";

export default function HomePage() {
  return (
    <>
      <h1>Interactive Statistics Textbook</h1>
      <p className="muted">Learn by manipulating distributions, not just reading formulas.</p>

      <div className="card-grid" style={{ marginTop: "1.25rem" }}>
        {modules.map((module) => (
          <Link className="card" href={`/modules/${module.slug}`} key={module.slug}>
            <h3 style={{ marginTop: 0 }}>{module.title}</h3>
            <p className="muted">{module.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
