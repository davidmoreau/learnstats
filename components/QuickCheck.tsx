"use client";

import { useMemo, useState } from "react";

type Question = {
  prompt: string;
  options: string[];
  answer: number;
};

type QuickCheckProps = {
  title?: string;
  questions?: Question[];
};

const QUESTIONS_BY_TITLE: Record<string, Question[]> = {
  "Quick Check: Sampling + CLT": [
    {
      prompt: "If sample size n increases, what usually happens to SEM?",
      options: ["It decreases", "It increases", "It stays exactly constant"],
      answer: 0
    },
    {
      prompt: "The Central Limit Theorem says the sample mean becomes approximately normal when...",
      options: ["n is sufficiently large", "the population is always normal", "the sample size is always 2"],
      answer: 0
    },
    {
      prompt: "For a strongly skewed population, increasing n tends to make the sampling distribution...",
      options: ["more symmetric", "more skewed", "unchanged in shape"],
      answer: 0
    }
  ],
  "Quick Check: LLN": [
    {
      prompt: "The Law of Large Numbers is about...",
      options: ["long-run convergence of averages", "single-trial certainty", "making all distributions normal"],
      answer: 0
    },
    {
      prompt: "If you double the number of trials, the running mean typically becomes...",
      options: ["less noisy", "more random", "exactly equal to p"],
      answer: 0
    },
    {
      prompt: "LLN requires that samples are typically treated as...",
      options: ["independent and identically distributed", "all equal", "sorted before averaging"],
      answer: 0
    }
  ],
  "Quick Check: Confidence Intervals": [
    {
      prompt: "A 95% confidence level means...",
      options: ["about 95% of intervals from repeated samples contain the true mean", "this one interval has 95% chance to be correct", "95% of sample points are inside the interval"],
      answer: 0
    },
    {
      prompt: "Increasing sample size n usually makes intervals...",
      options: ["narrower", "wider", "unchanged in width"],
      answer: 0
    },
    {
      prompt: "Raising confidence from 90% to 99% usually makes intervals...",
      options: ["wider", "narrower", "identical"],
      answer: 0
    }
  ],
  "Quick Check: P-hacking": [
    {
      prompt: "If you test many outcomes and report the smallest p-value, false positives usually...",
      options: ["increase", "decrease", "stay exactly the same"],
      answer: 0
    },
    {
      prompt: "A core guardrail against p-hacking is...",
      options: ["pre-registration", "collecting fewer variables", "always using alpha = 0.20"],
      answer: 0
    },
    {
      prompt: "Under a true null, nominal alpha = 0.05 means about...",
      options: ["5% false positives for one planned test", "50% false positives", "0% false positives"],
      answer: 0
    }
  ],
  "Quick Check: Meta-analysis": [
    {
      prompt: "In a fixed-effect style pool, higher-weight studies are typically those with...",
      options: ["smaller standard errors", "larger p-values", "more skewed outcomes"],
      answer: 0
    },
    {
      prompt: "I² is commonly used to summarize...",
      options: ["between-study heterogeneity", "sample size", "publication year"],
      answer: 0
    },
    {
      prompt: "A pooled estimate mostly helps by...",
      options: ["combining information to reduce noise", "eliminating all bias", "making all studies identical"],
      answer: 0
    }
  ],
  "Quick Check: Diagnostic Bayes": [
    {
      prompt: "PPV means...",
      options: ["P(disease | positive test)", "P(positive test | disease)", "test specificity"],
      answer: 0
    },
    {
      prompt: "When prevalence is very low, positive tests are often...",
      options: ["more likely false positives than expected", "always true positives", "unaffected by specificity"],
      answer: 0
    },
    {
      prompt: "Increasing specificity mainly helps reduce...",
      options: ["false positives", "true positives", "disease prevalence"],
      answer: 0
    }
  ],
  "Quick Check: Hypothesis Testing": [
    {
      prompt: "When the true effect is zero, rejection rate is approximately...",
      options: ["type I error rate", "power", "effect size"],
      answer: 0
    },
    {
      prompt: "Power usually increases when...",
      options: ["sample size increases", "alpha decreases sharply", "noise increases"],
      answer: 0
    },
    {
      prompt: "A p-value is best interpreted as...",
      options: ["data extremeness under H0", "probability H0 is true", "effect magnitude"],
      answer: 0
    }
  ],
  "Quick Check: Regression": [
    {
      prompt: "Multiple regression helps by...",
      options: ["estimating partial effects", "removing all confounding automatically", "making predictors independent"],
      answer: 0
    },
    {
      prompt: "Omitted variable bias is larger when omitted predictors are...",
      options: ["related to both Y and included X", "unrelated to everything", "constant"],
      answer: 0
    },
    {
      prompt: "A regression coefficient is best viewed as...",
      options: ["expected change in Y per unit X (holding others fixed)", "a correlation matrix entry", "the sample mean"],
      answer: 0
    }
  ],
  "Quick Check: ANOVA Family": [
    {
      prompt: "ANCOVA mainly extends ANOVA by adding...",
      options: ["covariate adjustment", "Bayesian priors", "nonparametric ranks only"],
      answer: 0
    },
    {
      prompt: "RM-ANOVA is useful when measurements are...",
      options: ["repeated on the same subjects", "all from separate groups", "only binary"],
      answer: 0
    },
    {
      prompt: "ANOVA F-statistic compares...",
      options: ["between-condition to within-condition variability", "means to medians", "sample size to alpha"],
      answer: 0
    }
  ],
  "Quick Check: EFA": [
    {
      prompt: "EFA primarily analyzes...",
      options: ["covariance/correlation structure", "class labels", "time-to-event hazards"],
      answer: 0
    },
    {
      prompt: "A scree plot shows...",
      options: ["eigenvalues by component", "residual histograms", "p-values by test"],
      answer: 0
    },
    {
      prompt: "High cross-loadings generally make factors...",
      options: ["less distinct", "more orthogonal automatically", "irrelevant"],
      answer: 0
    }
  ],
  "Quick Check: Multilevel": [
    {
      prompt: "ICC captures...",
      options: ["within-cluster similarity", "model AIC", "missing data fraction"],
      answer: 0
    },
    {
      prompt: "As ICC rises with fixed cluster size, effective N usually...",
      options: ["decreases", "increases", "stays unchanged"],
      answer: 0
    },
    {
      prompt: "Multilevel models are useful because they...",
      options: ["respect hierarchical dependence", "require no assumptions", "always increase effect sizes"],
      answer: 0
    }
  ],
  "Quick Check: Composite Measures": [
    {
      prompt: "Composite scores often improve...",
      options: ["reliability", "sampling bias", "causal identification"],
      answer: 0
    },
    {
      prompt: "Cronbach-style alpha usually rises when...",
      options: ["number of coherent items increases", "items become random noise", "sample size halves"],
      answer: 0
    },
    {
      prompt: "A major benefit of composites is...",
      options: ["noise reduction through averaging", "eliminating measurement entirely", "guaranteeing validity"],
      answer: 0
    }
  ]
};

export function QuickCheck({ title = "Quick Check", questions }: QuickCheckProps) {
  const safeQuestions = Array.isArray(questions)
    ? questions
    : (QUESTIONS_BY_TITLE[title] ?? []);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const correctCount = useMemo(
    () =>
      safeQuestions.reduce((acc, q, idx) => {
        return answers[idx] === q.answer ? acc + 1 : acc;
      }, 0),
    [answers, safeQuestions]
  );

  return (
    <section className="quickcheck">
      <h3>{title}</h3>
      {safeQuestions.map((q, idx) => {
        const selected = answers[idx];
        const hasAnswer = selected !== undefined;
        const isCorrect = hasAnswer && selected === q.answer;

        return (
          <fieldset key={q.prompt}>
            <legend>{idx + 1}. {q.prompt}</legend>
            {q.options.map((option, optionIdx) => (
              <label key={option} style={{ display: "block", marginTop: "0.3rem" }}>
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={optionIdx}
                  checked={selected === optionIdx}
                  onChange={() => setAnswers((prev) => ({ ...prev, [idx]: optionIdx }))}
                />{" "}
                {option}
              </label>
            ))}
            {hasAnswer ? (
              <p className="feedback">{isCorrect ? "Correct." : `Not quite. Correct answer: ${q.options[q.answer]}.`}</p>
            ) : null}
          </fieldset>
        );
      })}

      <p className="feedback">
        Score this session: {correctCount}/{safeQuestions.length}
      </p>
    </section>
  );
}
