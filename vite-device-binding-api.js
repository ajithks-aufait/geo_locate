import fs from 'node:fs'
import path from 'node:path'

const BINDINGS_FILE = path.resolve(process.cwd(), '.device-bindings.json')

function readBindings() {
  try {
    if (!fs.existsSync(BINDINGS_FILE)) return {}
    return JSON.parse(fs.readFileSync(BINDINGS_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function writeBindings(data) {
  fs.writeFileSync(BINDINGS_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

export function deviceBindingApiPlugin() {
  const attach = (server) => {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, 'http://localhost')
      if (!url.pathname.startsWith('/api/device-binding')) {
        next()
        return
      }

      const bindings = readBindings()

      try {
        if (req.method === 'GET') {
          const email = url.searchParams.get('email')?.trim().toLowerCase()
          if (!email) {
            sendJson(res, 400, { message: 'email is required' })
            return
          }
          const row = bindings[email]
          if (!row) {
            sendJson(res, 404, { message: 'not registered' })
            return
          }
          sendJson(res, 200, row)
          return
        }

        if (req.method === 'POST') {
          const body = await parseBody(req)
          const email = body.email?.trim().toLowerCase()
          const deviceId = body.deviceId?.trim()
          if (!email || !deviceId) {
            sendJson(res, 400, { message: 'email and deviceId are required' })
            return
          }

          const existing = bindings[email]
          if (existing && existing.deviceId !== deviceId) {
            sendJson(res, 409, {
              message: 'Account is registered on another device',
              deviceId: existing.deviceId,
            })
            return
          }

          bindings[email] = {
            deviceId,
            boundAt: existing?.boundAt ?? new Date().toISOString(),
          }
          writeBindings(bindings)
          sendJson(res, 200, bindings[email])
          return
        }

        sendJson(res, 405, { message: 'Method not allowed' })
      } catch (err) {
        sendJson(res, 500, { message: err.message || 'Server error' })
      }
    })
  }

  return {
    name: 'device-binding-api',
    configureServer(server) {
      attach(server)
    },
    configurePreviewServer(server) {
      attach(server)
    },
  }
}
