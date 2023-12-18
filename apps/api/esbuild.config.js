import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    platform: "node",
    target: "esnext",
    format: "esm",
    outfile: "dist/index.js",
    bundle: true,
  })
  .then((event) => console.log(event))
  .catch((error) => console.log(error));
