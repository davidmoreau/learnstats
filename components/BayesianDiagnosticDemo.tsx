"use client";

import { useMemo, useState } from "react";
import { ConceptDemo } from "@/components/ConceptDemo";
import Plot from "@/components/Plot";
import { useDebouncedValue } from "@/components/useDebouncedValue";

function round(value: number) {
  return Math.round(value);
}

export function BayesianDiagnosticDemo() {
  const [prevalence, setPrevalence] = useState(0.01);
  const [sensitivity, setSensitivity] = useState(0.9);
  const [specificity, setSpecificity] = useState(0.95);
  const [populationSize, setPopulationSize] = useState(100000);

  const config = useDebouncedValue({ prevalence, sensitivity, specificity, populationSize }, 100);

  const result = useMemo(() => {
    const diseased = config.populationSize * config.prevalence;
    const healthy = config.populationSize - diseased;

    const tp = diseased * config.sensitivity;
    const fn = diseased - tp;
    const tn = healthy * config.specificity;
    const fp = healthy - tn;

    const positiveTests = tp + fp;
    const negativeTests = tn + fn;

    const ppv = positiveTests > 0 ? tp / positiveTests : 0;
    const npv = negativeTests > 0 ? tn / negativeTests : 0;
    const falsePositiveShareAmongPositives = positiveTests > 0 ? fp / positiveTests : 0;

    return {
      tp,
      fn,
      tn,
      fp,
      positiveTests,
      negativeTests,
      ppv,
      npv,
      falsePositiveShareAmongPositives
    };
  }, [config]);

  return (
    <ConceptDemo
      title="Bayesian Diagnostic Inference"
      controls={
        <>
          <div className="control">
            <label htmlFor="bd-prev">Disease prevalence: {(prevalence * 100).toFixed(2)}%</label>
            <input
              id="bd-prev"
              type="range"
              min={0.001}
              max={0.3}
              step={0.001}
              value={prevalence}
              onChange={(e) => setPrevalence(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="bd-sens">Sensitivity: {(sensitivity * 100).toFixed(1)}%</label>
            <input
              id="bd-sens"
              type="range"
              min={0.5}
              max={0.999}
              step={0.001}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="bd-spec">Specificity: {(specificity * 100).toFixed(1)}%</label>
            <input
              id="bd-spec"
              type="range"
              min={0.5}
              max={0.999}
              step={0.001}
              value={specificity}
              onChange={(e) => setSpecificity(Number(e.target.value))}
            />
          </div>

          <div className="control">
            <label htmlFor="bd-pop">Population size: {populationSize.toLocaleString()}</label>
            <input
              id="bd-pop"
              type="range"
              min={1000}
              max={1000000}
              step={1000}
              value={populationSize}
              onChange={(e) => setPopulationSize(Number(e.target.value))}
            />
          </div>
        </>
      }
      charts={
        <>
          <Plot
            data={[
              {
                type: "bar",
                x: ["True positives", "False positives"],
                y: [result.tp, result.fp],
                name: "Positive split",
                marker: { color: ["#0f766e", "#dc2626"] }
              }
            ]}
            layout={{
              title: "Among Positive Tests: True vs False Positives",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
              paper_bgcolor: "white",
              plot_bgcolor: "white",
              yaxis: { title: "Count" }
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: "100%" }}
          />

          <Plot
            data={[
              {
                type: "bar",
                x: ["TP", "FP", "TN", "FN"],
                y: [result.tp, result.fp, result.tn, result.fn],
                marker: { color: ["#059669", "#ef4444", "#2563eb", "#f59e0b"] }
              }
            ]}
            layout={{
              title: "Expected Confusion Matrix Counts",
              height: 280,
              margin: { t: 40, r: 10, l: 45, b: 45 },
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
            PPV (P(disease | positive)) = <strong>{(result.ppv * 100).toFixed(1)}%</strong>, NPV = <strong>{(result.npv * 100).toFixed(1)}%</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            False positives among positives: <strong>{(result.falsePositiveShareAmongPositives * 100).toFixed(1)}%</strong>. With rare disease, this can dominate even with decent sensitivity/specificity.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            Expected counts in {populationSize.toLocaleString()}: TP {round(result.tp).toLocaleString()}, FP {round(result.fp).toLocaleString()}, TN {round(result.tn).toLocaleString()}, FN {round(result.fn).toLocaleString()}.
          </p>
        </>
      }
    />
  );
}
