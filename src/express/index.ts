import { Express, Response, Request } from 'express'
import { match } from 'path-to-regexp'
import {
  Result, resultAction
} from './result'
import {
  Arrow, combine
} from '../index'
import { Left, Right } from '../either'

export interface Context {
  req: Request
}

export type notFound = { path: string, method: string }

export enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options'
}

export type httpRoutes<A extends Context> = Arrow<A, notFound | Result, Result>
export type httpApp<A extends Context> = Arrow<A, Result, Result>

export const runResponse = (res: Response, result: Result): void => {
  res.set('content-type', result.contentType || 'application/json')
  const {
    headers, cookies, clearCookies, action
  } = result
  if (headers) {
    res.set(headers)
  }
  if (cookies) {
    cookies.forEach((cookie) => {
      const { name, value, ...options } = cookie
      res.cookie(name, value, options)
    })
  }
  if (clearCookies) {
    clearCookies.forEach((clearCookie) => {
      const { name, ...options } = clearCookie
      res.clearCookie(name, options)
    })
  }
  if (action) {
    const [resMethod, firstarg, options, cb] = action
    if (resMethod === resultAction.redirect) {
      return res[resMethod](firstarg)
    }
    if (resMethod === resultAction.sendFile) {
      return res[resMethod](firstarg, options)
    }
    if (resMethod === resultAction.render) {
      return res[resMethod](firstarg, options, cb)
    }
  }
  res.status(result.status).send(result.body)
}

const matchMethodAndPath = (method: HttpMethods) => <A extends Context>(path: string) => Arrow<A, notFound, A & { req: { params: object } }>(
  async (ctx: A) => {
    const _match = match(path)(ctx.req.baseUrl)
    if (_match && ctx.req.method.toLowerCase() === method) {
      return Right<A & { req: { params: object } }>(({ ...ctx, req: { ...ctx.req, params: _match.params } }))
    }
    return Left<notFound>({ path: ctx.req.path, method: ctx.req.method })
  }
)

export const get = matchMethodAndPath(HttpMethods.GET)
export const post = matchMethodAndPath(HttpMethods.POST)
export const patch = matchMethodAndPath(HttpMethods.PATCH)
export const put = matchMethodAndPath(HttpMethods.PUT)
export const del = matchMethodAndPath(HttpMethods.DELETE)
export const options = matchMethodAndPath(HttpMethods.OPTIONS)

const bindApp = <A = {}>(
  a: httpApp<A & Context>,
  onError: (e?: Error) => Result,
  dependencies: A) => (expressApp: Express) => {
    expressApp.use('*', (req, res) => a.run({ req, ...dependencies },
      result => result,
      result => result,
      onError)
      .then(result => runResponse(res, result)))
  }

const combineRoutes = <A extends Context>(...as: httpRoutes<A>[]) => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combine(as[1])
  const [a, b, ...aas] = as
  return combine(a.combine(b), ...aas)
}
