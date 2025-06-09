"use server";

import { promises as fs } from "fs";
import path from "path";

export async function getMapStyle() {
  const data = await fs.readFile(
    path.join(process.cwd(), "data/map/style.json"),
    "utf8"
  );
  return JSON.parse(data) as maplibregl.StyleSpecification;
}