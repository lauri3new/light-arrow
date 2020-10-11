import { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Arrow
} from '../Arrow/index'
import { Either, Left, Right } from '../either'
import {
  Context, HttpMethods, isNotFound, isResult, notFound, Result, runResponse
} from './result'

export type httpRoutes<A extends Context = Context> = Arrow<A, notFound | Result, Result> | Arrow<A, notFound, Result>
export type httpApp<A extends Context = Context> = (ctx: A) => Promise<Result>
export type Middleware<A, B extends A> = Arrow<A, Result, B>

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
): httpApp<A> => (ctx: A) => a.runAsPromise(ctx)
    .catch((b: notFound | Result | Error) => {
      if (isNotFound(b)) {
        return onNotFound(b)
      } if (isResult(b)) {
        return b
      }
      return onError(b)
    })

const matchMethodAndPathHandler = (method: HttpMethods) => <A extends Context, B extends object = object>(
  path: string,
  handler: (_: A & { params: B }) => Promise<Either<Result, Result>>
): Arrow<A, notFound | Result, Result> => Arrow<A, notFound | Result, Result>(async (ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return handler({ ...ctx, params: _match.params as B })
  }
  return Left({ path: ctx.req.path, method: ctx.req.method })
})
export const getHandler = matchMethodAndPathHandler(HttpMethods.GET)
export const postHandler = matchMethodAndPathHandler(HttpMethods.POST)
export const patchHandler = matchMethodAndPathHandler(HttpMethods.PATCH)
export const putHandler = matchMethodAndPathHandler(HttpMethods.PUT)
export const delHandler = matchMethodAndPathHandler(HttpMethods.DELETE)
export const optionsHandler = matchMethodAndPathHandler(HttpMethods.OPTIONS)

const matchMethodAndPathHandlerMw = (method: HttpMethods) => <D extends Context, A extends D, B extends object = object>(
  path: string,
  middleware: Middleware<D, A>,
  handler: (_: A & { params: B }) => Promise<Either<Result, Result>>
): Arrow<D, notFound | Result, Result> => middleware.andThenFunction<notFound | Result, Result>((async (ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return handler({ ...ctx, params: _match.params as B })
  }
  return Left({ path: ctx.req.path, method: ctx.req.method })
}))


export const getHandlerMw = matchMethodAndPathHandler(HttpMethods.GET)
export const postHandlerMw = matchMethodAndPathHandler(HttpMethods.POST)
export const patchHandlerMw = matchMethodAndPathHandler(HttpMethods.PATCH)
export const putHandlerMw = matchMethodAndPathHandler(HttpMethods.PUT)
export const delHandlerMw = matchMethodAndPathHandler(HttpMethods.DELETE)
export const optionsHandlerMw = matchMethodAndPathHandler(HttpMethods.OPTIONS)

const matchMethodAndPath = (method: HttpMethods) => <A extends Context, B extends object = object>(
  path: string
): Arrow<A, notFound | Result, A & { params: B }> => Arrow<A, notFound | Result, A & { params: B }>(async (ctx: A) => {
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
