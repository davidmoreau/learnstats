"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

function mean(xs: number[]) {
  return xs.reduce((a, x) => a + x, 0) / xs.length;
}

function sd(xs: number[]) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length);
}

function corr(xs: number[], ys: number[]) {
  const mx = mean(xs);
  const my = mean(ys);
  let c = 0;
  for (let i = 0; i < xs.length; i += 1) c += (xs[i] - mx) * (ys[i] - my);
  c /= xs.length;
  return c / (sd(xs) * sd(ys));
}

export function CompositeMeasuresDemo() {
  const [sampleSize, setSampleSize] = useState(800);
  const [numItems, setNumItems] = useState(6);
  const [itemReliability, setItemReliability] = useState(0.5);
  const [seed, setSeed] = useState("comp-2026");

  const config = useDebouncedValue({ sampleSize, numItems, itemReliability, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);
    const load = Math.sqrt(Math.max(1e-6, config.itemReliability));
    const noiseScale = Math.sqrt(Math.max(1e-6, 1 - config.itemReliability));

    const theta: number[] = [];
    const items: number[][] = Array.from({ length: config.numItems }, () => []);
    const composite: number[] = [];

    for (let i = 0; i < config.sampleSize; i += 1) {
      const t = normalRand(rand);
      theta.push(t);
      let sum = 0;

      for (let j = 0; j < config.numItems; j += 1) {
        const x = load * t + noiseScale * normalRand(rand);
        items[j].push(x);
        sum += x;
      }

      composite.push(sum / config.numItems);
    }

    const singleCorr = corr(items[0], theta);
    const compositeCorr = corr(composite, theta);

    let rBar = 0;
    let pairCount = 0;
    for (let i = 0; i < config.numItems; i += 1) {
      for (let j = i + 1; j < config.numItems; j += 1) {
        rBar += corr(items[i], items[j]);
        pairCount += 1;
      }
    }
    rBar = pairCount > 0 ? rBar / pairCount : 0;

    const alpha = config.numItems > 1 ? (config.numItems * rBar) / (1 + (config.numItems - 1) * rBar) : 0;

    const theoryCurve = Array.from({ length: 20 }, (_, idx) => {
      const k = idx + 1;
      const rel = (k * config.itemReliability) / (1 + (k - 1) * config.itemReliability);
      return { k, rel };
    });

    return {
      seedNumber,
      theta,
      composite,
      singleCorr,
      compositeCorr,
      alpha,
      theoryCurve
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Benefits of Composite Measures"
      controls={
        <>
          <div className="control">
            <label htmlFor="cm-n">Sample size: {sampleSize}</label>
            <input id="cm-n" type="range" min={100} max={4000} step={50} value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="cm-k">Number of items: {numItems}</label>
            <input id="cm-k" type="range" min={1} max={20} step={1} value={numItems} onChange={(e) => setNumItems(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="cm-rel">Single-item reliability: {itemReliability.toFixed(2)}</label>
            <input
              id="cm-rel"
              type="range"
              min={0.05}
              max={0.95}
              step={0.01}
              value={itemReliability}
              onChange={(e) => setItemReliability(Number(e.target.value))}
            />
          </div>
          <div className="control">
            <label htmlFor="cm-seed">Seed</label>
            <input id="cm-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
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
                x: simulation.theta,
                y: simulation.composite,
                marker: { color: "#0f766e", size: 5, opacity: 0.45 }
              }
            ]}
            layout={{
              title: "Latent Trait vs Composite Score",
              height: 300,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              xaxis: { title: "True latent trait" },
              yaxis: { title: "Composite" },
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
                x: ["Single item", "Composite"],
                y: [simulation.singleCorr, simulation.compositeCorr],
                marker: { color: ["#dc2626", "#2563eb"] }
              },
              {
                type: "scatter",
                mode: "lines+markers",
                x: simulation.theoryCurve.map((d) => d.k),
                y: simulation.theoryCurve.map((d) => d.rel),
                line: { color: "#0f766e" },
                marker: { color: "#0f766e" },
                name: "Expected reliability by item count",
                xaxis: "x2",
                yaxis: "y2"
              }
            ]}
            layout={{
              title: "Information Gain from Composites",
              height: 330,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              xaxis: { domain: [0, 0.45] },
              yaxis: { title: "Correlation", range: [0, 1] },
              xaxis2: { domain: [0.55, 1], title: "Number of items", anchor: "y2" },
              yaxis2: { title: "Reliability", range: [0, 1], anchor: "x2" },
              showlegend: false
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </>
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Correlation with latent trait: single item <strong>{simulation.singleCorr.toFixed(3)}</strong>, composite <strong>{simulation.compositeCorr.toFixed(3)}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Estimated Cronbach-style alpha: <strong>{simulation.alpha.toFixed(3)}</strong>. Averaging items reduces random measurement noise.
          </p>
        </>
      }
    />
  );
}
