"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

function normalCdf(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c2 = 0.3989423;

  if (x >= 0) {
    const t = 1 / (1 + p * x);
    return 1 - c2 * Math.exp((-x * x) / 2) * t * ((((b5 * t + b4) * t + b3) * t + b2) * t + b1);
  }
  return 1 - normalCdf(-x);
}

function twoSidedPFromZ(z: number) {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

export function HypothesisTestingDemo() {
  const [n, setN] = useState(60);
  const [trueEffect, setTrueEffect] = useState(0);
  const [alpha, setAlpha] = useState(0.05);
  const [numExperiments, setNumExperiments] = useState(1000);
  const [seed, setSeed] = useState("ht-2026");

  const config = useDebouncedValue({ n, trueEffect, alpha, numExperiments, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const pValues: number[] = [];
    let rejectCount = 0;

    for (let i = 0; i < config.numExperiments; i += 1) {
      const z = config.trueEffect * Math.sqrt(config.n) + normalRand(rand);
      const pValue = twoSidedPFromZ(z);
      pValues.push(pValue);
      if (pValue < config.alpha) rejectCount += 1;
    }

    return {
      seedNumber,
      pValues,
      rejectionRate: rejectCount / config.numExperiments
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Hypothesis Testing: p-values and Rejection Rates"
      controls={
        <>
          <div className="control">
            <label htmlFor="ht-n">Sample size n: {n}</label>
            <input id="ht-n" type="range" min={10} max={500} step={5} value={n} onChange={(e) => setN(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="ht-effect">True effect size: {trueEffect.toFixed(2)}</label>
            <input
              id="ht-effect"
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={trueEffect}
              onChange={(e) => setTrueEffect(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ht-alpha">Alpha: {alpha.toFixed(2)}</label>
            <input
              id="ht-alpha"
              type="range"
              min={0.01}
              max={0.2}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ht-runs">Experiments: {numExperiments}</label>
            <input
              id="ht-runs"
              type="range"
              min={200}
              max={5000}
              step={100}
              value={numExperiments}
              onChange={(e) => setNumExperiments(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ht-seed">Seed</label>
            <input id="ht-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[{ type: "histogram", x: simulation.pValues, nbinsx: 40, marker: { color: "#2563eb" } }]}
            layout={{
              title: "Distribution of p-values",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              xaxis: { title: "p-value" },
              paper_bgcolor: "white",
              plot_bgcolor: "white"
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />

          <Plot
            data={[
              {
                type: "bar",
                x: ["Observed rejection", "Nominal alpha"],
                y: [simulation.rejectionRate, alpha],
                marker: { color: ["#0f766e", "#dc2626"] }
              }
            ]}
            layout={{
              title: "Rejection Rate",
              height: 250,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              yaxis: { title: "Rate", range: [0, 1] },
              paper_bgcolor: "white",
              plot_bgcolor: "white"
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </>
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Observed rejection rate: <strong>{(simulation.rejectionRate * 100).toFixed(1)}%</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            When true effect is near zero, this approximates type I error; otherwise it reflects power.
          </p>
        </>
      }
    />
  );
}
