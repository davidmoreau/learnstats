"use client";

import { useMemo, useState } from "react";
import { ConceptDemo } from "@/components/ConceptDemo";
import Plot from "@/components/Plot";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32 } from "@/lib/random";

type LLNPoint = {
  trial: number;
  mean: number;
};

function formatNum(value: number) {
  return Number.isFinite(value) ? value.toFixed(4) : "-";
}

export function LawOfLargeNumbersDemo() {
  const [p, setP] = useState(0.6);
  const [trials, setTrials] = useState(500);
  const [seed, setSeed] = useState("lln-2026");

  const config = useDebouncedValue({ p, trials, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);
    const points: LLNPoint[] = [];

    let successes = 0;
    for (let i = 1; i <= config.trials; i += 1) {
      if (rand() < config.p) successes += 1;
      points.push({ trial: i, mean: successes / i });
    }

    const finalMean = points[points.length - 1]?.mean ?? 0;
    return {
      seedNumber,
      points,
      finalMean,
      error: Math.abs(finalMean - config.p)
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Law of Large Numbers"
      controls={
        <>
          <div className="control">
            <label htmlFor="lln-p">True success probability p: {p.toFixed(2)}</label>
            <input
              id="lln-p"
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="lln-trials">Number of trials: {trials}</label>
            <input
              id="lln-trials"
              type="range"
              min={50}
              max={2000}
              step={10}
              value={trials}
              onChange={(e) => setTrials(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="lln-seed">Seed</label>
            <input id="lln-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <Plot
          data={[
            {
              x: simulation.points.map((d) => d.trial),
              y: simulation.points.map((d) => d.mean),
              type: "scatter",
              mode: "lines",
              name: "Running mean",
              line: { color: "#2563eb", width: 2 }
            },
            {
              x: [1, simulation.points.length],
              y: [p, p],
              type: "scatter",
              mode: "lines",
              name: "True p",
              line: { color: "#dc2626", dash: "dash" }
            }
          ]}
          layout={{
            title: "Running Mean of Bernoulli Outcomes",
            height: 360,
            margin: { t: 40, r: 10, l: 45, b: 45 },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            xaxis: { title: "Trial" },
            yaxis: { title: "Running mean", range: [0, 1] }
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
        />
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Final running mean = <strong>{formatNum(simulation.finalMean)}</strong>
          </p>
          <p style={{ marginBottom: 0 }}>
            Absolute error from true <strong>p</strong> is <strong>{formatNum(simulation.error)}</strong>. More trials generally reduce this error.
          </p>
        </>
      }
    />
  );
}
