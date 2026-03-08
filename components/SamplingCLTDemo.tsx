"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";
import { mean, sd } from "@/lib/stats";

type PopulationType = "normal" | "uniform" | "skewed";

function drawPopulationValue(type: PopulationType, rand: () => number) {
  if (type === "normal") return normalRand(rand);
  if (type === "uniform") return -2 + rand() * 4;
  return -1 + -Math.log(Math.max(1e-12, 1 - rand()));
}

function formatNum(value: number) {
  return Number.isFinite(value) ? value.toFixed(3) : "-";
}

export function SamplingCLTDemo() {
  const [n, setN] = useState(30);
  const [numSamples, setNumSamples] = useState(1000);
  const [populationType, setPopulationType] = useState<PopulationType>("skewed");
  const [seed, setSeed] = useState("2026");

  const config = useDebouncedValue({ n, numSamples, populationType, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const randForPopulation = mulberry32(seedNumber ^ 0xa5a5a5a5);
    const randForSampling = mulberry32(seedNumber ^ 0x5a5a5a5a);

    const population = Array.from({ length: 12000 }, () =>
      drawPopulationValue(config.populationType, randForPopulation)
    );

    const sampleMeans: number[] = [];
    for (let i = 0; i < config.numSamples; i += 1) {
      let total = 0;
      for (let j = 0; j < config.n; j += 1) {
        total += drawPopulationValue(config.populationType, randForSampling);
      }
      sampleMeans.push(total / config.n);
    }

    const popMean = mean(population);
    const popSd = sd(population);
    const samplingMean = mean(sampleMeans);
    const samplingSd = sd(sampleMeans);
    const sem = popSd / Math.sqrt(config.n);

    return {
      seedNumber,
      population,
      sampleMeans,
      popMean,
      popSd,
      samplingMean,
      samplingSd,
      sem
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Sampling Distribution of the Mean"
      controls={
        <>
          <div className="control">
            <label htmlFor="n-slider">Sample size n: {n}</label>
            <input
              id="n-slider"
              type="range"
              min={5}
              max={200}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="samples-slider">Num samples: {numSamples}</label>
            <input
              id="samples-slider"
              type="range"
              min={200}
              max={5000}
              step={100}
              value={numSamples}
              onChange={(e) => setNumSamples(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="population-type">Population type</label>
            <select
              id="population-type"
              value={populationType}
              onChange={(e) => setPopulationType(e.target.value as PopulationType)}
            >
              <option value="normal">Normal</option>
              <option value="uniform">Uniform</option>
              <option value="skewed">Skewed (Exponential-like)</option>
            </select>
          </div>

          <div className="control">
            <label htmlFor="seed">Seed</label>
            <input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>

          <p className="muted" style={{ margin: 0 }}>
            Plot updates are debounced by 250ms while dragging controls.
          </p>
        </>
      }
      charts={
        <>
          <Plot
            data={[
              {
                type: "histogram",
                x: simulation.population,
                nbinsx: 45,
                marker: { color: "#0f766e" },
                opacity: 0.8,
                name: "Population"
              }
            ]}
            layout={{
              title: "Population Histogram",
              height: 300,
              margin: { t: 40, r: 10, l: 40, b: 40 },
              paper_bgcolor: "white",
              plot_bgcolor: "white"
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />

          <Plot
            data={[
              {
                type: "histogram",
                x: simulation.sampleMeans,
                nbinsx: 45,
                marker: { color: "#1d4ed8" },
                opacity: 0.85,
                name: "Sample Means"
              }
            ]}
            layout={{
              title: "Sampling Distribution of Mean",
              height: 300,
              margin: { t: 40, r: 10, l: 40, b: 40 },
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
            Population mean = <strong>{formatNum(simulation.popMean)}</strong>, SD ={" "}
            <strong>{formatNum(simulation.popSd)}</strong>, SEM = <strong>{formatNum(simulation.sem)}</strong>
          </p>
          <p style={{ marginBottom: 0 }}>
            Sampling distribution mean = <strong>{formatNum(simulation.samplingMean)}</strong>, SD ={" "}
            <strong>{formatNum(simulation.samplingSd)}</strong>. As <strong>n</strong> grows, the sample means cluster tighter.
          </p>
        </>
      }
    />
  );
}
