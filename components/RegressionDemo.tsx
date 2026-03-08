"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

function mean(xs: number[]) {
  return xs.reduce((a, x) => a + x, 0) / xs.length;
}

function variance(xs: number[]) {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
}

function covariance(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let sum = 0;
  for (let i = 0; i < xs.length; i += 1) sum += (xs[i] - mx) * (ys[i] - my);
  return sum / xs.length;
}

export function RegressionDemo() {
  const [n, setN] = useState(350);
  const [beta1, setBeta1] = useState(0.8);
  const [beta2, setBeta2] = useState(0.6);
  const [rho, setRho] = useState(0.6);
  const [noiseSd, setNoiseSd] = useState(1);
  const [seed, setSeed] = useState("reg-2026");

  const config = useDebouncedValue({ n, beta1, beta2, rho, noiseSd, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const x1: number[] = [];
    const x2: number[] = [];
    const y: number[] = [];

    const rhoSafe = Math.max(-0.95, Math.min(0.95, config.rho));
    const orthScale = Math.sqrt(1 - rhoSafe * rhoSafe);

    for (let i = 0; i < config.n; i += 1) {
      const z1 = normalRand(rand);
      const z2 = normalRand(rand);
      const x1Val = z1;
      const x2Val = rhoSafe * z1 + orthScale * z2;
      const yVal = config.beta1 * x1Val + config.beta2 * x2Val + config.noiseSd * normalRand(rand);
      x1.push(x1Val);
      x2.push(x2Val);
      y.push(yVal);
    }

    const var1 = variance(x1);
    const var2 = variance(x2);
    const cov12 = covariance(x1, x2);
    const cov1y = covariance(x1, y);
    const cov2y = covariance(x2, y);

    const b1Simple = cov1y / var1;
    const det = var1 * var2 - cov12 * cov12;
    const b1Multi = (cov1y * var2 - cov2y * cov12) / det;
    const b2Multi = (cov2y * var1 - cov1y * cov12) / det;

    return {
      seedNumber,
      x1,
      y,
      b1Simple,
      b1Multi,
      b2Multi
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Regression: Simple vs Multiple"
      controls={
        <>
          <div className="control">
            <label htmlFor="rg-n">Sample size n: {n}</label>
            <input id="rg-n" type="range" min={80} max={2000} step={20} value={n} onChange={(e) => setN(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="rg-b1">True beta for X1: {beta1.toFixed(2)}</label>
            <input id="rg-b1" type="range" min={-2} max={2} step={0.01} value={beta1} onChange={(e) => setBeta1(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="rg-b2">True beta for X2: {beta2.toFixed(2)}</label>
            <input id="rg-b2" type="range" min={-2} max={2} step={0.01} value={beta2} onChange={(e) => setBeta2(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="rg-rho">Correlation(X1, X2): {rho.toFixed(2)}</label>
            <input id="rg-rho" type="range" min={-0.95} max={0.95} step={0.01} value={rho} onChange={(e) => setRho(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="rg-noise">Noise SD: {noiseSd.toFixed(2)}</label>
            <input id="rg-noise" type="range" min={0.2} max={3} step={0.05} value={noiseSd} onChange={(e) => setNoiseSd(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="rg-seed">Seed</label>
            <input id="rg-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[
              {
                type: "scatter",
                mode: "markers",
                x: simulation.x1,
                y: simulation.y,
                marker: { color: "#64748b", size: 5, opacity: 0.45 },
                name: "Data"
              }
            ]}
            layout={{
              title: "Outcome vs X1",
              height: 320,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              xaxis: { title: "X1" },
              yaxis: { title: "Y" },
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
                name: "True",
                x: ["Beta X1", "Beta X2"],
                y: [beta1, beta2],
                marker: { color: "#0f766e" }
              },
              {
                type: "bar",
                name: "Simple (Y~X1)",
                x: ["Beta X1", "Beta X2"],
                y: [simulation.b1Simple, 0],
                marker: { color: "#dc2626" }
              },
              {
                type: "bar",
                name: "Multiple (Y~X1+X2)",
                x: ["Beta X1", "Beta X2"],
                y: [simulation.b1Multi, simulation.b2Multi],
                marker: { color: "#2563eb" }
              }
            ]}
            layout={{
              title: "Coefficient Comparison",
              barmode: "group",
              height: 300,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              yaxis: { title: "Coefficient" },
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
            Simple-model estimate for X1: <strong>{simulation.b1Simple.toFixed(3)}</strong>. Multiple-model estimates: X1 <strong>{simulation.b1Multi.toFixed(3)}</strong>, X2 <strong>{simulation.b2Multi.toFixed(3)}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            When X1 and X2 are correlated and X2 affects Y, simple regression on X1 alone can be biased.
          </p>
        </>
      }
    />
  );
}
