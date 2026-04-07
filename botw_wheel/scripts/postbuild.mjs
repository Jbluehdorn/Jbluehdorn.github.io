import { readFileSync, writeFileSync } from 'fs'

const builtHtml = readFileSync('dist/index.html', 'utf8')
const prodHtml = builtHtml.replaceAll('./', './dist/')
writeFileSync('index.html', prodHtml)
console.log('Wrote production index.html')
