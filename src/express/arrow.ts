import { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Arrow, ArrowK, reject
} from '../arrow/index'
import {
  Context, HttpMethods, notFound, Result, runResponse
} from './result'

export type httpRoutes<Ctx, A extends Context = Context> = (ctx: A) => Arrow<Ctx, notFound | Result, Result> | Arrow<Ctx, notFound, Result>
export type httpApp<A extends Context = Context> = (ctx: A) => Promise<Result>

interface hasCapabilities<A> {
  capabilities: A
}

export const bindApp = <A>(httpApp: httpApp<hasCapabilities<A> & Context>, capabilities: A) => (expressApp: Express) => {
  expressApp.use('*', (req, res) => httpApp({ req, capabilities }).then((result) => {
    runResponse(res, result)
  }))
}

// export const seal = <Ctx, A extends Context>(
//   a: httpRoutes<Ctx, A>, b: Ctx, onNotFound: (_: notFound) => Result, onError: (e?: Error) => Result
// ): httpApp<A> => (ctx: A) => {
//     const _r = a(ctx) as Arrow<Ctx, notFound | Result, Result>
//     return _r.run(
//       b,
//       r => r,
//       f => {
//         if (isNotFound(f)) return onNotFound(f)
//         return f
//       },
//       onError
//     )
//   }

const matchMethodAndPath = (method: HttpMethods) => <Ctx, A extends Context>(path: string, handler: ArrowK<Ctx, A, never, Result> | ArrowK<Ctx, A, Result, Result>): ArrowK<Ctx, A, notFound | Result, Result> => (ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return handler(({ ...ctx, req: { ...ctx.req, params: _match.params } }))
  }
  return reject<notFound, never, Ctx>({ path: ctx.req.path, method: ctx.req.method })
}

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)
