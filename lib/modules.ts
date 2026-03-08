export type ModuleMeta = {
  slug: string;
  title: string;
  summary: string;
};

export const modules: ModuleMeta[] = [
  {
    slug: "sampling-clt",
    title: "Sampling Distributions & CLT",
    summary: "See how sample means tighten and approach normality as n grows."
  },
  {
    slug: "law-large-numbers",
    title: "Law of Large Numbers",
    summary: "Watch a running average stabilize toward the true probability."
  },
  {
    slug: "confidence-intervals",
    title: "Confidence Intervals",
    summary: "Simulate many intervals and inspect empirical coverage."
  },
  {
    slug: "p-hacking",
    title: "P-hacking",
    summary: "See how testing many outcomes inflates false positives under the null."
  },
  {
    slug: "meta-analysis",
    title: "Meta-analysis",
    summary: "Combine noisy studies and inspect pooled effects and heterogeneity."
  },
  {
    slug: "bayesian-diagnostic-inference",
    title: "Bayesian Diagnostic Inference",
    summary: "Explore base-rate effects in medical testing and false positives."
  },
  {
    slug: "hypothesis-testing",
    title: "Hypothesis Testing",
    summary: "Connect p-values, alpha, type I error, and power through simulation."
  },
  {
    slug: "regression",
    title: "Regression (Simple and Multiple)",
    summary: "Compare simple and multiple regression under correlated predictors."
  },
  {
    slug: "anova-family",
    title: "ANOVA / ANCOVA / RM-ANOVA",
    summary: "Contrast mean-comparison designs and how covariates/repeated measures help."
  },
  {
    slug: "efa",
    title: "Exploratory Factor Analysis",
    summary: "Inspect correlation matrices and scree plots for latent structure."
  },
  {
    slug: "multilevel-modeling",
    title: "Multilevel Modeling",
    summary: "See why clustering reduces effective sample size and affects inference."
  },
  {
    slug: "composite-measures",
    title: "Composite Measures",
    summary: "Show reliability and signal gains from averaging multiple indicators."
  }
];

export function getModuleBySlug(slug: string) {
  return modules.find((m) => m.slug === slug);
}
