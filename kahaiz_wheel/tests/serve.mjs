import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
}

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    let file = path.resolve(root, `.${pathname}`)
    if (file !== path.resolve(root) && !file.startsWith(root)) {
      response.writeHead(403).end()
      return
    }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html')
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
    response.end(await readFile(file))
  } catch {
    response.writeHead(404).end()
  }
}).listen(4178, '127.0.0.1')
