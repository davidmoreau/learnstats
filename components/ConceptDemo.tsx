import type { ReactNode } from "react";

type ConceptDemoProps = {
  title: string;
  controls: ReactNode;
  charts: ReactNode;
  interpretation: ReactNode;
};

export function ConceptDemo({ title, controls, charts, interpretation }: ConceptDemoProps) {
  return (
    <section className="demo-shell">
      <h3>{title}</h3>
      <div className="demo-layout">
        <aside className="panel">{controls}</aside>
        <div>
          {charts}
          <div className="interpretation">{interpretation}</div>
        </div>
      </div>
    </section>
  );
}
