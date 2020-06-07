import { Express } from 'express'
import { match } from 'path-to-regexp'
import {
  Result, Context, HttpMethods, runResponse, isNotFound, notFound
} from './result'
import {
  PromiseEither, PromiseEitherK, reject
} from '../promiseEither/index'

export type httpRoutes<A extends Context = Context> = (ctx: A) => PromiseEither<notFound | Result, Result> | PromiseEither<notFound, Result>
export type httpApp<A extends Context = Context> = (ctx: A) => Promise<Result>

interface hasCapabilities<A> {
  capabilities: A
}

export const bindApp = <A>(httpApp: httpApp<hasCapabilities<A> & Context>, capabilities: A) => (expressApp: Express) => {
  expressApp.use('*', (req, res) => httpApp({ req, capabilities }).then((result) => {
    runResponse(res, result)
  }))
}

export const seal = <A extends Context>(a: httpRoutes<A>, onNotFound: (_: notFound) => Result, onError: (e?: Error) => Result): httpApp<A> => (ctx: A) => {
  const _r = a(ctx) as PromiseEither<notFound | Result, Result>
  return _r.onComplete(
    r => r,
    b => {
      if (isNotFound(b)) return onNotFound(b)
      return b
    },
    onError
  )
}

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(path: string, handler: PromiseEitherK<A, never, Result> | PromiseEitherK<A, Result, Result>): PromiseEitherK<A, notFound | Result, Result> => (ctx: A) => {
  const _match = match(path)(ctx.req.baseUrl)
  if (_match && ctx.req.method.toLowerCase() === method) {
    return handler(({ ...ctx, req: { ...ctx.req, params: _match.params } }))
  }
  return reject<notFound, never>({ path: ctx.req.path, method: ctx.req.method })
}

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)
