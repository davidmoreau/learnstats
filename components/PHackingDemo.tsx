"use client";

import { useMemo, useState } from "react";
import { ConceptDemo } from "@/components/ConceptDemo";
import Plot from "@/components/Plot";
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

  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c2 * Math.exp((-x * x) / 2.0) * t * ((((b5 * t + b4) * t + b3) * t + b2) * t + b1);
  }
  return 1 - normalCdf(-x);
}

function twoSidedPFromZ(z: number) {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

export function PHackingDemo() {
  const [nPerGroup, setNPerGroup] = useState(40);
  const [numStudies, setNumStudies] = useState(800);
  const [numOutcomes, setNumOutcomes] = useState(8);
  const [alpha, setAlpha] = useState(0.05);
  const [seed, setSeed] = useState("phack-2026");

  const config = useDebouncedValue({ nPerGroup, numStudies, numOutcomes, alpha, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);
    const se = Math.sqrt(2 / config.nPerGroup);

    const minPs: number[] = [];
    let primarySig = 0;
    let hackedSig = 0;

    for (let s = 0; s < config.numStudies; s += 1) {
      let minP = 1;
      let primaryP = 1;

      for (let o = 0; o < config.numOutcomes; o += 1) {
        const z = (normalRand(rand) * se) / se;
        const pValue = twoSidedPFromZ(z);
        if (o === 0) primaryP = pValue;
        if (pValue < minP) minP = pValue;
      }

      minPs.push(minP);
      if (primaryP < config.alpha) primarySig += 1;
      if (minP < config.alpha) hackedSig += 1;
    }

    return {
      seedNumber,
      minPs,
      primaryRate: primarySig / config.numStudies,
      hackedRate: hackedSig / config.numStudies
    };
  }, [config]);

  return (
    <ConceptDemo
      title="P-hacking Under a True Null"
      controls={
        <>
          <div className="control">
            <label htmlFor="ph-n">Sample size per group: {nPerGroup}</label>
            <input
              id="ph-n"
              type="range"
              min={10}
              max={200}
              step={5}
              value={nPerGroup}
              onChange={(e) => setNPerGroup(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ph-studies">Simulated studies: {numStudies}</label>
            <input
              id="ph-studies"
              type="range"
              min={200}
              max={5000}
              step={100}
              value={numStudies}
              onChange={(e) => setNumStudies(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ph-outcomes">Outcomes tested per study: {numOutcomes}</label>
            <input
              id="ph-outcomes"
              type="range"
              min={1}
              max={30}
              step={1}
              value={numOutcomes}
              onChange={(e) => setNumOutcomes(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ph-alpha">Alpha: {alpha.toFixed(2)}</label>
            <input
              id="ph-alpha"
              type="range"
              min={0.01}
              max={0.2}
              step={0.01}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ph-seed">Seed</label>
            <input id="ph-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
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
                x: ["Primary outcome only", "Best of many outcomes"],
                y: [simulation.primaryRate, simulation.hackedRate],
                marker: { color: ["#0f766e", "#dc2626"] }
              }
            ]}
            layout={{
              title: "False Positive Rate",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              yaxis: { title: "Rate", range: [0, 1] }
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />

          <Plot
            data={[
              {
                type: "histogram",
                x: simulation.minPs,
                nbinsx: 40,
                marker: { color: "#1d4ed8" }
              }
            ]}
            layout={{
              title: "Distribution of Minimum p-value per Study",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              xaxis: { title: "Minimum p-value" }
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />
        </>
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            With one pre-registered test, false positive rate is about <strong>{(simulation.primaryRate * 100).toFixed(1)}%</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            When searching across {numOutcomes} outcomes and reporting the smallest p-value, it rises to <strong>{(simulation.hackedRate * 100).toFixed(1)}%</strong>.
          </p>
        </>
      }
    />
  );
}
