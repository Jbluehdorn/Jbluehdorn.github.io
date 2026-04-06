// Postbuild: rewrite dist/index.html paths and overwrite root index.html
// for GitHub Pages. Vite dev uses index.html directly (with src/main.jsx),
// and the build output replaces it with production paths.
import { readFileSync, writeFileSync } from 'fs'

const builtHtml = readFileSync('dist/index.html', 'utf8')
const prodHtml = builtHtml.replaceAll('./', './dist/')
writeFileSync('index.html', prodHtml)
console.log('Wrote production index.html')
