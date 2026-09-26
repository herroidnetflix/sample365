import fs from "node:fs/promises";
import path from "node:path";

const source = new URL("../setup-assets/", import.meta.url);
const target = new URL("../.netlify/v1/blobs/deploy/family-private/", import.meta.url);
await fs.rm(target, { recursive: true, force: true });
await fs.mkdir(target, { recursive: true });

const files = await fs.readdir(source);
for (const file of files) {
  await fs.copyFile(new URL(file, source), new URL(file, target));
  console.log(`Prepared private blob: family-private/${file}`);
}
