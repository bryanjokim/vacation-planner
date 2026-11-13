"use client";
// OWNED BY SLICE S7. Selected Block with Ask and Find options (artboard 5, under the map).
import type { BlockPanelProps } from "./types";

export function BlockPanel({ block }: BlockPanelProps) {
  return <section className="card" style={{ padding: 16 }}>{block ? block.title : "Pick a Block."}</section>;
}
