"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const DynamicPlot = dynamic(() => import("react-plotly.js"), {
  ssr: false
}) as ComponentType<any>;

export default function Plot(props: any) {
  return <DynamicPlot {...props} />;
}
