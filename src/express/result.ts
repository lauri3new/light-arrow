import { CookieOptions } from 'express'

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

type body = object | Buffer | string | undefined

export interface Result<A extends body = any> {
  contentType?: string
  body: A
  status: httpStatus
  headers?: { [key: string]: string }
  cookies?: Cookie[]
  clearCookies?: Cookie[]
  action?: [ resultAction, string] | [ resultAction, string, object] | [ resultAction, string, object, (error: any, html: any) => void ]
  map: <B extends body = any>(f: (_: Result<A>) => Result<B>) => Result<B>
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

export const Result = <A extends body = any>(status: httpStatus, body: A, contentType = 'application/json'):Result<A> => ({
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
