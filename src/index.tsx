import { Hono } from 'hono'
import { html, raw } from 'hono/html'

export interface Env {
  R2_BUCKET: R2Bucket
} //TODO: setup this

const app = new Hono<{ Bindings: Env }>()

app.get('/secure', (c) => {
  const email = c.req.header('Cf-Access-Authenticated-User-Email') || 'Unknown User'
  const timestamp = new Date().toISOString()
  const country = c.req.header('Cf-Ipcountry')?.toLocaleLowerCase() || 'Unknown'
  // return c.text(`${email} authenticated at ${timestamp} from ${country}`)
  return c.html(
      html`<!doctype html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Page</title>
      </head>
      <body>
        <p>“${email} authenticated at ${timestamp} from <a href="secure/${country}">${country}</a>”</p>
        </body>
    `)
})

app.get('/secure/*', async (c) => {    // TODO: fix this route

  const pathSegments = c.req.path.split('/')
  console.log(pathSegments)
  
  if (pathSegments.length > 3) {
    return new Response("Wrong path used", { status: 404 });
  }

  const country = pathSegments[pathSegments.length - 1] 
  const flag = await c.env.R2_BUCKET.get(country + '.png')
  
  if (flag === null) {
    return new Response("Flag Not Found", { status: 404 });
  }

  const headers = new Headers()
  flag.writeHttpMetadata(headers)
  headers.set("etag", flag.httpEtag)
  
  return new Response(flag.body, {
      headers
    }
  )
})


export default app
