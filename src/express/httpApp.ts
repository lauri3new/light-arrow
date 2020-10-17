import { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Arrow
} from '../arrow/index'
import { Left, Right } from '../either'
import {
  Context, HttpMethods, isNotFound, isResult, notFound, Result, runResponse
} from './result'

export type httpRoutes<A extends Context = Context> = Arrow<A, notFound | Result, Result> | Arrow<A, notFound, Result>
export type httpApp<A extends Context = Context> = (ctx: A) => Promise<Result>

export const bindApp = <A>(httpApp: httpApp<A & Context>, capabilities: A) => (app: Express) => {
  app.use('*', (req, res) => httpApp({ req, ...capabilities }).then((result) => {
    runResponse(res, result)
  }))
  return {
    app,
    capabilities
  }
}

export const seal = <A extends Context>(
  a: httpRoutes<A>,
  onNotFound: (_: notFound | Result) => Result,
  onError: (e?: Error) => Result
): httpApp<A> => (ctx: A) => a.runAsPromiseResult(ctx)
    .catch((b: notFound | Result | Error) => {
      if (isNotFound(b)) {
        return onNotFound(b)
      } if (isResult(b)) {
        return b
      }
      return onError(b)
    })

const matchMethodAndPath = (method: HttpMethods) => <B extends object = object, A extends Context = Context>(
  path: string
): Arrow<A, notFound | Result, { params: B }> => Arrow<A, notFound | Result, { params: B }>(async (ctx: Context) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return Right(({ ...ctx, params: _match.params as B }))
  }
  return Left({ path: ctx.req.path, method: ctx.req.method })
})

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)
