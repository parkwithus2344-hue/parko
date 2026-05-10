import serverless from 'serverless-http'
import app from '../../src/app'

// Netlify strips the function name from the path, so a request to
// /api/parking arrives here as /parking — we restore the /api prefix
// so Express routes (mounted at /api/*) match correctly.
const handler = serverless(app, {
  request(req: Record<string, unknown>) {
    req.url = '/api' + req.url
  },
})

export { handler }
