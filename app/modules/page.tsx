import Link from "next/link";
import { modules } from "@/lib/modules";

export default function ModulesIndexPage() {
  return (
    <>
      <h1>Modules</h1>
      <p className="muted">Choose a lesson.</p>
      <div className="card-grid">
        {modules.map((module) => (
          <Link className="card" key={module.slug} href={`/modules/${module.slug}`}>
            <h3 style={{ marginTop: 0 }}>{module.title}</h3>
            <p className="muted">{module.summary}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
