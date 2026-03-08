"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

type Structure = "one-factor" | "two-factor";

function mean(xs: number[]) {
  return xs.reduce((a, x) => a + x, 0) / xs.length;
}

function correlationMatrix(data: number[][]) {
  const p = data[0].length;
  const n = data.length;
  const means = Array.from({ length: p }, (_, j) => mean(data.map((row) => row[j])));
  const centered = data.map((row) => row.map((v, j) => v - means[j]));

  const cov: number[][] = Array.from({ length: p }, () => Array.from({ length: p }, () => 0));
  for (let i = 0; i < p; i += 1) {
    for (let j = i; j < p; j += 1) {
      let s = 0;
      for (let r = 0; r < n; r += 1) s += centered[r][i] * centered[r][j];
      const c = s / (n - 1);
      cov[i][j] = c;
      cov[j][i] = c;
    }
  }

  const sd = Array.from({ length: p }, (_, j) => Math.sqrt(Math.max(cov[j][j], 1e-12)));
  const corr: number[][] = Array.from({ length: p }, () => Array.from({ length: p }, () => 0));
  for (let i = 0; i < p; i += 1) {
    for (let j = 0; j < p; j += 1) {
      corr[i][j] = cov[i][j] / (sd[i] * sd[j]);
    }
  }

  return corr;
}

function jacobiEigenvaluesSymmetric(matrix: number[][], maxIter = 120) {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);

  for (let iter = 0; iter < maxIter; iter += 1) {
    let p = 0;
    let q = 1;
    let maxOff = 0;

    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const v = Math.abs(a[i][j]);
        if (v > maxOff) {
          maxOff = v;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < 1e-8) break;

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    for (let i = 0; i < n; i += 1) {
      if (i !== p && i !== q) {
        const aip = a[i][p];
        const aiq = a[i][q];
        a[i][p] = c * aip - s * aiq;
        a[p][i] = a[i][p];
        a[i][q] = s * aip + c * aiq;
        a[q][i] = a[i][q];
      }
    }

    a[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
    a[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][q] = 0;
    a[q][p] = 0;
  }

  return a.map((row, i) => row[i]).sort((x, y) => y - x);
}

export function EFADemo() {
  const [sampleSize, setSampleSize] = useState(600);
  const [numItems, setNumItems] = useState(8);
  const [loadingStrength, setLoadingStrength] = useState(0.7);
  const [crossLoading, setCrossLoading] = useState(0.15);
  const [structure, setStructure] = useState<Structure>("two-factor");
  const [seed, setSeed] = useState("efa-2026");

  const config = useDebouncedValue({ sampleSize, numItems, loadingStrength, crossLoading, structure, seed }, 250);

  const sim = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const p = config.numItems;
    const rows: number[][] = [];

    for (let r = 0; r < config.sampleSize; r += 1) {
      const f1 = normalRand(rand);
      const f2 = normalRand(rand);
      const row: number[] = [];

      for (let j = 0; j < p; j += 1) {
        const primaryOnF1 = config.structure === "one-factor" ? true : j < Math.ceil(p / 2);
        const l1 = primaryOnF1 ? config.loadingStrength : config.crossLoading;
        const l2 = primaryOnF1 ? (config.structure === "one-factor" ? 0 : config.crossLoading) : config.loadingStrength;
        const uniqueness = Math.sqrt(Math.max(1e-6, 1 - l1 * l1 - l2 * l2));
        const x = l1 * f1 + l2 * f2 + uniqueness * normalRand(rand);
        row.push(x);
      }

      rows.push(row);
    }

    const corr = correlationMatrix(rows);
    const eigenvalues = jacobiEigenvaluesSymmetric(corr);
    const overOne = eigenvalues.filter((v) => v > 1).length;

    return { seedNumber, corr, eigenvalues, overOne };
  }, [config]);

  return (
    <ConceptDemo
      title="Exploratory Factor Analysis (EFA)"
      controls={
        <>
          <div className="control">
            <label htmlFor="efa-structure">Factor structure</label>
            <select id="efa-structure" value={structure} onChange={(e) => setStructure(e.target.value as Structure)}>
              <option value="one-factor">One factor</option>
              <option value="two-factor">Two factors</option>
            </select>
          </div>
          <div className="control">
            <label htmlFor="efa-n">Sample size: {sampleSize}</label>
            <input id="efa-n" type="range" min={100} max={3000} step={50} value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="efa-p">Number of items: {numItems}</label>
            <input id="efa-p" type="range" min={4} max={12} step={1} value={numItems} onChange={(e) => setNumItems(Number(e.target.value))} />
          </div>
          <div className="control">
            <label htmlFor="efa-l">Primary loading: {loadingStrength.toFixed(2)}</label>
            <input id="efa-l" type="range" min={0.2} max={0.95} step={0.01} value={loadingStrength} onChange={(e) => setLoadingStrength(Number(e.target.value))} />
          </div>
          {structure === "two-factor" ? (
            <div className="control">
              <label htmlFor="efa-c">Cross-loading: {crossLoading.toFixed(2)}</label>
              <input id="efa-c" type="range" min={0} max={0.45} step={0.01} value={crossLoading} onChange={(e) => setCrossLoading(Number(e.target.value))} />
            </div>
          ) : null}
          <div className="control">
            <label htmlFor="efa-seed">Seed</label>
            <input id="efa-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {sim.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[{ type: "heatmap", z: sim.corr, colorscale: "RdBu", zmid: 0, zmin: -1, zmax: 1 }]}
            layout={{
              title: "Item Correlation Matrix",
              height: 320,
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
                type: "scatter",
                mode: "lines+markers",
                x: sim.eigenvalues.map((_, i) => i + 1),
                y: sim.eigenvalues,
                marker: { color: "#2563eb" },
                line: { color: "#2563eb" }
              },
              {
                type: "scatter",
                mode: "lines",
                x: [1, sim.eigenvalues.length],
                y: [1, 1],
                line: { color: "#dc2626", dash: "dash" }
              }
            ]}
            layout={{
              title: "Scree Plot (Eigenvalues)",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              xaxis: { title: "Component" },
              yaxis: { title: "Eigenvalue" },
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
            Number of eigenvalues greater than 1: <strong>{sim.overOne}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            Strong primary loadings and weaker cross-loadings usually produce clearer factor separation.
          </p>
        </>
      }
    />
  );
}
