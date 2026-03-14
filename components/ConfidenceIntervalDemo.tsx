"use client";

import { useMemo, useState } from "react";
import { ConceptDemo } from "@/components/ConceptDemo";
import Plot from "@/components/Plot";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";
import { mean } from "@/lib/stats";

type PopulationType = "normal" | "skewed";

type IntervalResult = {
  idx: number;
  sampleMean: number;
  halfWidth: number;
  contains: boolean;
};

function sampleSd(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function zForConfidence(confidence: number) {
  const table: Record<number, number> = {
    80: 1.282,
    90: 1.645,
    95: 1.96,
    99: 2.576
  };
  return table[confidence] ?? 1.96;
}

function drawPopulationValue(populationType: PopulationType, rand: () => number) {
  if (populationType === "normal") return normalRand(rand);
  return -1 + -Math.log(Math.max(1e-12, 1 - rand()));
}

export function ConfidenceIntervalDemo() {
  const [n, setN] = useState(50);
  const [numIntervals, setNumIntervals] = useState(120);
  const [confidence, setConfidence] = useState(95);
  const [populationType, setPopulationType] = useState<PopulationType>("normal");
  const [seed, setSeed] = useState("ci-2026");

  const config = useDebouncedValue({ n, numIntervals, confidence, populationType, seed }, 250);

  const simulation = useMemo(() => {
    const trueMean = 0;
    const z = zForConfidence(config.confidence);
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);

    const intervals: IntervalResult[] = [];
    for (let i = 0; i < config.numIntervals; i += 1) {
      const sample = Array.from({ length: config.n }, () => drawPopulationValue(config.populationType, rand));
      const m = mean(sample);
      const s = sampleSd(sample);
      const halfWidth = z * (s / Math.sqrt(config.n));
      const lower = m - halfWidth;
      const upper = m + halfWidth;

      intervals.push({
        idx: i + 1,
        sampleMean: m,
        halfWidth,
        contains: lower <= trueMean && upper >= trueMean
      });
    }

    const covered = intervals.filter((x) => x.contains).length;
    const coverage = covered / intervals.length;

    return {
      seedNumber,
      trueMean,
      confidence: config.confidence,
      intervals,
      covered,
      missed: intervals.length - covered,
      coverage
    };
  }, [config]);

  const contains = simulation.intervals.filter((x) => x.contains);
  const misses = simulation.intervals.filter((x) => !x.contains);

  return (
    <ConceptDemo
      title="Confidence Intervals for a Mean"
      controls={
        <>
          <div className="control">
            <label htmlFor="ci-n">Sample size n: {n}</label>
            <input
              id="ci-n"
              type="range"
              min={20}
              max={300}
              step={5}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ci-k">Number of intervals: {numIntervals}</label>
            <input
              id="ci-k"
              type="range"
              min={50}
              max={400}
              step={10}
              value={numIntervals}
              onChange={(e) => setNumIntervals(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="ci-confidence">Confidence level</label>
            <select
              id="ci-confidence"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
            >
              <option value={80}>80%</option>
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
          </div>

          <div className="control">
            <label htmlFor="ci-pop">Population type</label>
            <select
              id="ci-pop"
              value={populationType}
              onChange={(e) => setPopulationType(e.target.value as PopulationType)}
            >
              <option value="normal">Normal</option>
              <option value="skewed">Skewed</option>
            </select>
          </div>

          <div className="control">
            <label htmlFor="ci-seed">Seed</label>
            <input id="ci-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <Plot
          data={[
            {
              x: contains.map((d) => d.sampleMean),
              y: contains.map((d) => d.idx),
              error_x: { type: "data", array: contains.map((d) => d.halfWidth), visible: true },
              type: "scatter",
              mode: "markers",
              marker: { color: "#0f766e", size: 6 },
              name: "Contains true mean"
            },
            {
              x: misses.map((d) => d.sampleMean),
              y: misses.map((d) => d.idx),
              error_x: { type: "data", array: misses.map((d) => d.halfWidth), visible: true },
              type: "scatter",
              mode: "markers",
              marker: { color: "#dc2626", size: 6 },
              name: "Misses true mean"
            },
            {
              x: [simulation.trueMean, simulation.trueMean],
              y: [0, simulation.intervals.length + 2],
              type: "scatter",
              mode: "lines",
              name: "True mean",
              line: { dash: "dash", color: "#111827" }
            }
          ]}
          layout={{
            title: "Simulated Confidence Intervals",
            height: 420,
            margin: { t: 40, r: 10, l: 45, b: 45 },
            paper_bgcolor: "white",
            plot_bgcolor: "white",
            xaxis: { title: "Interval center and width" },
            yaxis: { title: "Interval index" }
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
        />
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Coverage this run: <strong>{(simulation.coverage * 100).toFixed(1)}%</strong> ({simulation.covered}/{simulation.intervals.length})
          </p>
          <p style={{ marginBottom: 0 }}>
            About {simulation.confidence}% of intervals are expected to capture the true mean in repeated sampling.
          </p>
        </>
      }
    />
  );
}
