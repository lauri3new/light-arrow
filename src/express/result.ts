import { CookieOptions, Request, Response } from 'express'
import { Arrow, draw, succeed } from '../arrow'

export interface Cookie extends CookieOptions {
  name: string
  value: string
}

export interface ClearCookie extends CookieOptions {
  name: string
}

export enum resultAction {
  render = 'render',
  sendFile = 'sendFile',
  redirect = 'redirect',
}

export interface Context {
  req: Request
}

export type NotFound = { path: string, method: string }

export function isNotFound(a: NotFound | any): a is NotFound {
  return a?.path !== undefined && a?.method !== undefined
}

export enum HttpMethods {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  OPTIONS = 'options'
}

type body = object | Buffer | string | undefined

export interface Result<A extends body = any> {
  contentType?: string
  body: A
  status: httpStatus | number
  headers?: { [key: string]: string }
  cookies?: Cookie[]
  clearCookies?: Cookie[]
  action?: [ resultAction, string] | [ resultAction, string, object] | [ resultAction, string, object, (error: any, html: any) => void ]
  map?: <B extends body = any>(f: (_: Result<A>) => Result<B>) => Result<B>
}

export function isResult(a: Result | any): a is Result {
  return ['undefined', 'object', 'string'].includes(a?.body) && typeof a?.status === 'number'
}

export enum httpStatus {
  OK = 200,
  Created = 201,
  NoContent = 204,
  BadRequest = 400,
  Unauthorised = 401,
  Forbidden = 403,
  NotFound = 404,
  InternalServerError = 500
}

export const Result = <A extends body = any>(status: httpStatus | number, body: A, contentType = 'application/json'):Result<A> => ({
  status,
  body,
  contentType,
  map: <B extends body = any>(f: (_: Result<A>) => Result<B>) => f(Result(status, body, contentType))
})

export const OK = <A extends body = any>(body: A): Result<A> => Result(httpStatus.OK, body)
export const BadRequest = <A extends body = any>(body: A): Result<A> => Result(httpStatus.BadRequest, body)
export const InternalServerError = <A extends body = any>(body: A): Result<A> => Result(httpStatus.InternalServerError, body)
export const NotFound = <A extends body = any>(body: A): Result<A> => Result(httpStatus.NotFound, body)
export const Created = <A extends body = any>(body: A): Result<A> => Result(httpStatus.Created, body)
export const Unauthorised = <A extends body = any>(body: A): Result<A> => Result(httpStatus.Unauthorised, body)
export const Forbidden = <A extends body = any>(body: A): Result<A> => Result(httpStatus.Forbidden, body)
export const NoContent = () => Result(httpStatus.NoContent, undefined)

export const withCookies = <A extends Result>(cookies: Cookie[]) => (a: A) => ({
  ...a,
  cookies
})

export const clearCookies = <A extends Result>(cookies: ClearCookie[]) => (a: A) => ({
  ...a,
  clearCookies: cookies
})

export const withContentType = <A extends Result>(contentType: string) => (a: A) => ({
  ...a,
  contentType
})

export const withHeaders = <A extends Result>(headers: { [key: string]: string }) => (a: A) => ({
  ...a,
  headers: {
    ...a.headers,
    ...headers
  }
})

export const withAction = <A extends Result>(action: [ resultAction, string] | [ resultAction, string, object]) => (a: A) => ({
  ...a,
  action
})

export const runResponse = (res: Response, result: Result) => {
  res.set('content-type', result.contentType || 'application/json')
  const {
    // eslint-disable-next-line no-shadow
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

const authorizationMiddleware: Arrow<Context, Result, {
  loggedIn: boolean;
  req: Request;
}> = draw((ctx: Context) => {
  if (ctx.req.headers.authorization) {
    return succeed({ ...ctx, loggedIn: true })
  } else {
    return fail(Unauthorised({}))
  }
})

