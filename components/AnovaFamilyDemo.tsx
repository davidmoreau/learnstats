"use client";

import { useMemo, useState } from "react";
import Plot from "@/components/Plot";
import { ConceptDemo } from "@/components/ConceptDemo";
import { useDebouncedValue } from "@/components/useDebouncedValue";
import { hashSeed, mulberry32, normalRand } from "@/lib/random";

type Design = "anova" | "ancova" | "rm-anova";

function mean(xs: number[]) {
  return xs.reduce((a, x) => a + x, 0) / xs.length;
}

function computeAnovaF(groups: number[][]) {
  const k = groups.length;
  const nTotal = groups.reduce((a, g) => a + g.length, 0);
  const grand = mean(groups.flat());

  let ssBetween = 0;
  let ssWithin = 0;

  for (const g of groups) {
    const gm = mean(g);
    ssBetween += g.length * (gm - grand) ** 2;
    for (const v of g) ssWithin += (v - gm) ** 2;
  }

  const dfBetween = k - 1;
  const dfWithin = nTotal - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  return msWithin > 0 ? msBetween / msWithin : 0;
}

export function AnovaFamilyDemo() {
  const [design, setDesign] = useState<Design>("anova");
  const [nPerGroup, setNPerGroup] = useState(80);
  const [groupGap, setGroupGap] = useState(0.8);
  const [noiseSd, setNoiseSd] = useState(1);
  const [covariateEffect, setCovariateEffect] = useState(0.8);
  const [withinCorr, setWithinCorr] = useState(0.5);
  const [seed, setSeed] = useState("anova-2026");

  const config = useDebouncedValue({ design, nPerGroup, groupGap, noiseSd, covariateEffect, withinCorr, seed }, 250);

  const simulation = useMemo(() => {
    const seedNumber = hashSeed(config.seed);
    const rand = mulberry32(seedNumber);
    const means = [-config.groupGap, 0, config.groupGap];

    const groups: number[][] = [[], [], []];

    if (config.design === "anova") {
      for (let g = 0; g < 3; g += 1) {
        for (let i = 0; i < config.nPerGroup; i += 1) {
          groups[g].push(means[g] + config.noiseSd * normalRand(rand));
        }
      }
    } else if (config.design === "ancova") {
      const xAll: number[] = [];
      const yAll: number[] = [];
      const groupIndex: number[] = [];

      for (let g = 0; g < 3; g += 1) {
        for (let i = 0; i < config.nPerGroup; i += 1) {
          const x = normalRand(rand);
          const y = means[g] + config.covariateEffect * x + config.noiseSd * normalRand(rand);
          xAll.push(x);
          yAll.push(y);
          groupIndex.push(g);
        }
      }

      const mx = mean(xAll);
      const my = mean(yAll);
      let cov = 0;
      let vx = 0;
      for (let i = 0; i < xAll.length; i += 1) {
        cov += (xAll[i] - mx) * (yAll[i] - my);
        vx += (xAll[i] - mx) ** 2;
      }
      const beta = cov / vx;

      for (let i = 0; i < yAll.length; i += 1) {
        const residual = yAll[i] - beta * xAll[i];
        groups[groupIndex[i]].push(residual);
      }
    } else {
      const sigmaU = Math.sqrt(Math.max(1e-6, config.withinCorr));
      const sigmaE = Math.sqrt(Math.max(1e-6, 1 - config.withinCorr)) * config.noiseSd;
      const centeredGroups: number[][] = [[], [], []];

      for (let s = 0; s < config.nPerGroup; s += 1) {
        const u = sigmaU * normalRand(rand);
        const ys = means.map((m) => m + u + sigmaE * normalRand(rand));
        const subjectMean = mean(ys);
        for (let t = 0; t < 3; t += 1) {
          centeredGroups[t].push(ys[t] - subjectMean);
          groups[t].push(ys[t]);
        }
      }

      const fRm = computeAnovaF(centeredGroups);
      return {
        seedNumber,
        means: groups.map((g) => mean(g)),
        fStat: fRm,
        label: "RM-ANOVA (subject-centered)"
      };
    }

    return {
      seedNumber,
      means: groups.map((g) => mean(g)),
      fStat: computeAnovaF(groups),
      label: config.design === "anova" ? "ANOVA" : "ANCOVA (post-covariate residuals)"
    };
  }, [config]);

  return (
    <ConceptDemo
      title="ANOVA / ANCOVA / RM-ANOVA"
      controls={
        <>
          <div className="control">
            <label htmlFor="af-design">Design type</label>
            <select id="af-design" value={design} onChange={(e) => setDesign(e.target.value as Design)}>
              <option value="anova">ANOVA</option>
              <option value="ancova">ANCOVA</option>
              <option value="rm-anova">RM-ANOVA</option>
            </select>
          </div>

          <div className="control">
            <label htmlFor="af-n">N per group/subject: {nPerGroup}</label>
            <input id="af-n" type="range" min={20} max={300} step={5} value={nPerGroup} onChange={(e) => setNPerGroup(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="af-gap">Group/time mean gap: {groupGap.toFixed(2)}</label>
            <input id="af-gap" type="range" min={0} max={2} step={0.01} value={groupGap} onChange={(e) => setGroupGap(Number(e.target.value))} />
          </div>

          <div className="control">
            <label htmlFor="af-noise">Noise SD: {noiseSd.toFixed(2)}</label>
            <input id="af-noise" type="range" min={0.2} max={3} step={0.05} value={noiseSd} onChange={(e) => setNoiseSd(Number(e.target.value))} />
          </div>

          {design === "ancova" ? (
            <div className="control">
              <label htmlFor="af-cov">Covariate effect: {covariateEffect.toFixed(2)}</label>
              <input id="af-cov" type="range" min={0} max={2} step={0.01} value={covariateEffect} onChange={(e) => setCovariateEffect(Number(e.target.value))} />
            </div>
          ) : null}

          {design === "rm-anova" ? (
            <div className="control">
              <label htmlFor="af-rho">Within-subject correlation: {withinCorr.toFixed(2)}</label>
              <input id="af-rho" type="range" min={0.01} max={0.95} step={0.01} value={withinCorr} onChange={(e) => setWithinCorr(Number(e.target.value))} />
            </div>
          ) : null}

          <div className="control">
            <label htmlFor="af-seed">Seed</label>
            <input id="af-seed" value={seed} onChange={(e) => setSeed(e.target.value)} />
            <small className="muted">Numeric hash: {simulation.seedNumber}</small>
          </div>
        </>
      }
      charts={
        <Plot
          data={[
            {
              type: "scatter",
              mode: design === "rm-anova" ? "lines+markers" : "markers",
              x: ["Level 1", "Level 2", "Level 3"],
              y: simulation.means,
              marker: { color: "#2563eb", size: 9 },
              line: { color: "#2563eb" }
            }
          ]}
          layout={{
            title: { text: "Estimated Means by Condition" },
            height: 320,
            margin: { t: 40, r: 10, l: 45, b: 45 },
            yaxis: { title: "Mean outcome" },
            paper_bgcolor: "white",
            plot_bgcolor: "white"
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: "100%" }}
        />
      }
      interpretation={
        <>
          <p style={{ marginTop: 0 }}>
            Approximate F-statistic for {simulation.label}: <strong>{simulation.fStat.toFixed(3)}</strong>.
          </p>
          <p style={{ marginBottom: 0 }}>
            ANOVA compares group means, ANCOVA adjusts for covariates, and RM-ANOVA leverages within-subject structure.
          </p>
        </>
      }
    />
  );
}
