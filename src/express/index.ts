import { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Arrow, draw, reject
} from '../Arrow/index'
import { Left, Right } from '../either'
import {
  Context, HttpMethods, isNotFound, notFound, Result, runResponse
} from './result'

export type httpRoutes<A extends Context = Context> = Arrow<A, notFound | Result, Result> | Arrow<A, notFound, Result>
export type httpApp<A extends Context = Context> = (ctx: A) => Promise<Result>

// interface hasCapabilities<A> {
//   capabilities: A
// }

export const bindApp = <A>(httpApp: httpApp<A & Context>, capabilities: A) => (expressApp: Express) => {
  expressApp.use('*', (req, res) => httpApp({ req, ...capabilities }).then((result) => {
    runResponse(res, result)
  }))
}

export const seal = <A extends Context>(a: httpRoutes<A>, onNotFound: (_: notFound) => Result, onError: (e?: Error) => Result): httpApp<A> => (ctx: A) => a.runAsPromise(ctx).catch((b) => {
  if (isNotFound(b)) return onNotFound(b)
  // TODO: isResult
  return onError(b)
})

const matchMethodAndPathHandler = (method: HttpMethods) => <A extends Context>(path: string, handler: Arrow<A, never, Result> | Arrow<A, Result, Result>): Arrow<A, notFound | Result, Result> => draw<A, A, notFound | Result, Result>((ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return handler
  }
  return reject<notFound, never, A>({ path: ctx.req.path, method: ctx.req.method })
})

export const getHandler = matchMethodAndPathHandler(HttpMethods.GET)
export const postHandler = matchMethodAndPathHandler(HttpMethods.POST)
export const patchHandler = matchMethodAndPathHandler(HttpMethods.PATCH)
export const putHandler = matchMethodAndPathHandler(HttpMethods.PUT)
export const delHandler = matchMethodAndPathHandler(HttpMethods.DELETE)
export const optionsHandler = matchMethodAndPathHandler(HttpMethods.OPTIONS)

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(
  path: string
): Arrow<A, notFound | Result, A & { req: { params: object } }> => Arrow<A, notFound | Result, A & { req: { params: object } }>(async (ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return Right(({ ...ctx, req: { ...ctx.req, params: _match.params } }))
  }
  return Left({ path: ctx.req.path, method: ctx.req.method })
})

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)
