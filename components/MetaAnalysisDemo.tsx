"use client";

import { useMemo, useState } from "react";
import { ConceptDemo } from "@/components/ConceptDemo";
import Plot from "@/components/Plot";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

type StudyResult = {
  id: number;
  effect: number;
  se: number;
  lower: number;
  upper: number;
  weight: number;
};

export function MetaAnalysisDemo() {
  const [numStudies, setNumStudies] = useState(12);
  const [trueEffect, setTrueEffect] = useState(0.25);
  const [heterogeneity, setHeterogeneity] = useState(0.2);
  const [seed, setSeed] = useState("meta-2026");

  const config = useDebouncedValue({ numStudies, trueEffect, heterogeneity, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const studies: StudyResult[] = [];
    for (let i = 0; i < config.numStudies; i += 1) {
      const se = 0.08 + rand() * 0.35;
      const theta = config.trueEffect + config.heterogeneity * normalRand(rand);
      const observed = theta + se * normalRand(rand);
      const weight = 1 / (se * se);
      studies.push({
        id: i + 1,
        effect: observed,
        se,
        lower: observed - 1.96 * se,
        upper: observed + 1.96 * se,
        weight
      });
    }

    const sumW = studies.reduce((acc, s) => acc + s.weight, 0);
    const maxWeight = studies.reduce((acc, s) => Math.max(acc, s.weight), 0);
    const pooled = studies.reduce((acc, s) => acc + s.weight * s.effect, 0) / sumW;
    const pooledSe = Math.sqrt(1 / sumW);

    const q = studies.reduce((acc, s) => acc + s.weight * (s.effect - pooled) ** 2, 0);
    const df = studies.length - 1;
    const i2 = q > df ? ((q - df) / q) * 100 : 0;

    return {
      seedNumber,
      studies,
      maxWeight,
      pooled,
      pooledSe,
      pooledLower: pooled - 1.96 * pooledSe,
      pooledUpper: pooled + 1.96 * pooledSe,
      i2
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Meta-analysis (Fixed-effect View)"
      controls={
        <>
          <div className="control">
            <label htmlFor="ma-k">Number of studies: {numStudies}</label>
            <input
              id="ma-k"
              type="range"
              min={5}
              max={40}
              step={1}
              value={numStudies}
              onChange={(e) => setNumStudies(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ma-true">Underlying mean effect: {trueEffect.toFixed(2)}</label>
            <input
              id="ma-true"
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={trueEffect}
              onChange={(e) => setTrueEffect(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ma-tau">Between-study heterogeneity: {heterogeneity.toFixed(2)}</label>
            <input
              id="ma-tau"
              type="range"
              min={0}
              max={0.8}
              step={0.01}
              value={heterogeneity}
              onChange={(e) => setHeterogeneity(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ma-seed">Seed</label>
            <input id="ma-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[
              {
                x: simulation.studies.map((s) => s.effect),
                y: simulation.studies.map((s) => s.id),
                error_x: {
                  type: "data",
                  array: simulation.studies.map((s) => 1.96 * s.se),
                  visible: true
                },
                type: "scatter",
                mode: "markers",
                marker: {
                  size: simulation.studies.map((s) => 5 + (s.weight / simulation.maxWeight) * 7),
                  color: "#0f766e"
                },
                name: "Study estimate"
              },
              {
                x: [simulation.pooled, simulation.pooled],
                y: [0, simulation.studies.length + 2],
                type: "scatter",
                mode: "lines",
                line: { color: "#1d4ed8", dash: "dash" },
                name: "Pooled estimate"
              }
            ]}
            layout={{
              title: "Forest-style Plot",
              height: 380,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              xaxis: { title: "Effect size" },
              yaxis: { title: "Study" }
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />

          <Plot
            data={[
              {
                x: simulation.studies.map((s) => s.effect),
                y: simulation.studies.map((s) => s.se),
                type: "scatter",
                mode: "markers",
                marker: { color: "#7c3aed", size: 7 }
              }
            ]}
            layout={{
              title: "Funnel-style View",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              xaxis: { title: "Effect size" },
              yaxis: { title: "SE", autorange: "reversed" }
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </>
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Pooled effect = <strong>{simulation.pooled.toFixed(3)}</strong> (95% CI {simulation.pooledLower.toFixed(3)} to {simulation.pooledUpper.toFixed(3)})
          </p>
          <p style={{ marginBottom: 0 }}>
            Estimated heterogeneity signal: <strong>I² = {simulation.i2.toFixed(1)}%</strong>.
          </p>
        </>
      }
    />
  );
}
