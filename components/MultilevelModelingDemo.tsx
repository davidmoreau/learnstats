"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

function normalCdf(x: number) {
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

export function MultilevelModelingDemo() {
  const [clusters, setClusters] = useState(30);
  const [clusterSize, setClusterSize] = useState(25);
  const [icc, setIcc] = useState(0.2);
  const [numStudies, setNumStudies] = useState(800);
  const [alpha, setAlpha] = useState(0.05);
  const [seed, setSeed] = useState("mlm-2026");

  const config = useDebouncedValue({ clusters, clusterSize, icc, numStudies, alpha, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const nTotal = config.clusters * config.clusterSize;
    const designEffect = 1 + (config.clusterSize - 1) * config.icc;
    const nEff = nTotal / designEffect;

    const varCluster = Math.max(1e-6, config.icc);
    const varIndividual = Math.max(1e-6, 1 - config.icc);

    let naiveReject = 0;
    let adjustedReject = 0;

    for (let s = 0; s < config.numStudies; s += 1) {
      let y1sum = 0;
      let y0sum = 0;
      let n1 = 0;
      let n0 = 0;
      const ys: number[] = [];
      const xs: number[] = [];

      for (let c = 0; c < config.clusters; c += 1) {
        const u = Math.sqrt(varCluster) * normalRand(rand);
        for (let i = 0; i < config.clusterSize; i += 1) {
          const x = rand() < 0.5 ? 1 : 0;
          const y = u + Math.sqrt(varIndividual) * normalRand(rand);
          xs.push(x);
          ys.push(y);
          if (x === 1) {
            y1sum += y;
            n1 += 1;
          } else {
            y0sum += y;
            n0 += 1;
          }
        }
      }

      const diff = y1sum / n1 - y0sum / n0;
      const mu = ys.reduce((a, v) => a + v, 0) / ys.length;
      const varY = ys.reduce((a, v) => a + (v - mu) ** 2, 0) / Math.max(1, ys.length - 1);
      const seNaive = Math.sqrt(varY * (1 / n1 + 1 / n0));
      const seAdjusted = seNaive * Math.sqrt(designEffect);

      const pNaive = twoSidedPFromZ(diff / seNaive);
      const pAdjusted = twoSidedPFromZ(diff / seAdjusted);

      if (pNaive < config.alpha) naiveReject += 1;
      if (pAdjusted < config.alpha) adjustedReject += 1;
    }

    return {
      seedNumber,
      nTotal,
      nEff,
      designEffect,
      naiveRejectRate: naiveReject / config.numStudies,
      adjustedRejectRate: adjustedReject / config.numStudies
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Multilevel Modeling and Clustered Data"
      controls={
        <>
          <div className="control">
            <label htmlFor="mlm-j">Clusters: {clusters}</label>
            <input id="mlm-j" type="range" min={8} max={120} step={1} value={clusters} onChange={(e) => setClusters(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="mlm-m">Cluster size: {clusterSize}</label>
            <input id="mlm-m" type="range" min={4} max={80} step={1} value={clusterSize} onChange={(e) => setClusterSize(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="mlm-icc">ICC: {icc.toFixed(2)}</label>
            <input id="mlm-icc" type="range" min={0.01} max={0.7} step={0.01} value={icc} onChange={(e) => setIcc(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="mlm-runs">Simulated studies: {numStudies}</label>
            <input id="mlm-runs" type="range" min={200} max={4000} step={100} value={numStudies} onChange={(e) => setNumStudies(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="mlm-alpha">Alpha: {alpha.toFixed(2)}</label>
            <input id="mlm-alpha" type="range" min={0.01} max={0.2} step={0.01} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="mlm-seed">Seed</label>
            <input id="mlm-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[
              {
                type: "bar",
                x: ["Total N", "Effective N"],
                y: [simulation.nTotal, simulation.nEff],
                marker: { color: ["#2563eb", "#dc2626"] }
              }
            ]}
            layout={{
              title: "Nominal vs Effective Sample Size",
              height: 260,
              margin: { t: 40, r: 10, l: 45, b: 45 },
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
                x: ["Naive (ignore clusters)", "Adjusted (design effect)"],
                y: [simulation.naiveRejectRate, simulation.adjustedRejectRate],
                marker: { color: ["#f59e0b", "#0f766e"] }
              },
              {
                type: "scatter",
                mode: "lines",
                x: ["Naive (ignore clusters)", "Adjusted (design effect)"],
                y: [alpha, alpha],
                line: { color: "#111827", dash: "dash" },
                name: "Nominal alpha"
              }
            ]}
            layout={{
              title: "False Positive Rate under True Null",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              yaxis: { title: "Rejection rate", range: [0, 1] },
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
            Design effect = <strong>{simulation.designEffect.toFixed(2)}</strong>, so effective N drops from {simulation.nTotal.toLocaleString()} to about {Math.round(simulation.nEff).toLocaleString()}.
          </p>
          <p style={{ marginBottom: 0 }}>
            Multilevel-aware inference helps control false positives when observations within clusters are correlated.
          </p>
        </>
      }
    />
  );
}
