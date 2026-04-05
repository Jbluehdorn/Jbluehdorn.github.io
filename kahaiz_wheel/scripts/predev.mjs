// Predev: ensure index.html has the dev entry point for Vite HMR
import { writeFileSync } from 'fs'

const devHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The King's Wheel</title>
    <link rel="icon" type="image/png" href="./assets/img/favicon.png" />
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./src/main.jsx"></script>
</body>
</html>
`

writeFileSync('index.html', devHtml)
console.log('Restored dev index.html')
