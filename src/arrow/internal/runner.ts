/* eslint-disable no-await-in-loop */
import { List } from '@funkia/list'
import { Operation, Ops } from './operations'
import { worker } from './worker'

export function runner(context: any, operations: List<Operation>) {
  let cancelled = false
  let result: any
  let x: any
  let isLeft: boolean = false
  let error: any
  const ctx = context || {}
  return {
    cancelled: () => cancelled,
    cancel: () => {
      cancelled = true
    },
    async run() {
      for (const op of operations) {
        if (this.cancelled()) {
          return {
            failure: undefined,
            error,
            result,
            context
          }
        }
        try {
          if (isLeft) {
            switch (op._tag) {
              case Ops.leftMap: {
                if (isLeft) {
                  error = op.f(error)
                }
                break
              }
              case Ops.orElse: {
                isLeft = false
                error = undefined
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (r: any) => {
                      result = r
                    }
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  } else {
                    result = x.result
                  }
                }
                break
              }
            }
          } else {
            switch (op._tag) {
              case Ops.bracket: {
                x = await op.f[1](result).runAsPromise(context)
                await op.f[0](result).runAsPromise(context)
                if (x.failure) {
                  throw x.failure
                }
                if (x.error) {
                  isLeft = true
                  error = x.error
                } else {
                  result = x.result
                }
                break
              }
              case Ops.all:
                if (op.concurrencyLimit) {
                  const limit = op.f.length > op.concurrencyLimit ? op.concurrencyLimit : op.f.length
                  const entries = op.f.entries()
                  result = await Promise.all(new Array(limit).fill(entries).map(worker(context))).then((array) => array.flat())
                } else {
                  result = await Promise.all(op.f.map(_f => _f.runAsPromiseResult(context)))
                }
                break
              case Ops.race:
                result = await Promise.race(op.f.map(_f => _f.runAsPromiseResult(context)))
                break
              case Ops.andThen: {
                if (typeof op.f === 'function') {
                  x = await op.f(result)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (a: any) => {
                      result = a
                    }
                  )
                } else {
                  x = await op.f.runAsPromise(result)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  } else {
                    result = x.result
                  }
                }
                break
              }
              case Ops.group: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (r: any) => {
                      result = [result, r]
                    }
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  } else {
                    result = [result, x.result]
                  }
                }
                break
              }
              case Ops.groupFirst: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (r: any) => {}
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  }
                }
                break
              }
              case Ops.groupSecond: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (r: any) => {
                      result = r
                    }
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  } else {
                    result = x.result
                  }
                }
                break
              }
              case Ops.flatMap: {
                x = op.f(result)
                if (typeof x === 'function') {
                  x = await x(ctx)
                  x.match(
                    (e: any) => {
                      isLeft = true
                      error = e
                    },
                    (r: any) => {
                      result = r
                    }
                  )
                } else {
                  x = await x.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    isLeft = true
                    error = x.error
                  } else {
                    result = x.result
                  }
                }
                break
              }
              case Ops.map: {
                result = op.f(result)
                break
              }
              case Ops.init: {
                x = await op.f(ctx)
                x.match(
                  (e: any) => {
                    isLeft = true
                    error = e
                  },
                  (r: any) => {
                    result = r
                  }
                )
                break
              }
            }
          }
        } catch (e) {
          return {
            failure: e,
            error,
            result,
            context
          }
        }
      }

      return {
        error,
        result,
        context
      }
    }
  }
}
