/* eslint-disable no-await-in-loop */
import { List, toArray } from '@funkia/list'
import { Operation, Ops } from './operations'
import { worker } from './worker'

export function runner(context: any, operations: List<Operation>) {
  const stack = toArray(operations)
  let cancelled = false
  let result: any
  let x: any
  let isLeft: boolean = false
  let error: any
  const ctx = context || {}
  const matchError = (e: any) => {
    isLeft = true
    error = e
  }
  const matchResult = (r: any) => {
    result = r
  }
  const resetError = () => {
    isLeft = false
    error = undefined
  }
  const matchGroupResult = (r: any) => {
    result = [result, r]
  }
  const noChange = () => {}
  return {
    cancelled: () => cancelled,
    cancel: () => {
      cancelled = true
    },
    async run() {
      while (stack.length) {
        const op = stack.pop()
        if (this.cancelled() || !op) {
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
                resetError()
                if (typeof op.f === 'function') {
                  // cant be optimised in same fashion
                  x = await op.f(ctx)
                  x.match(
                    matchError,
                    matchResult
                  )
                } else {
                  stack.push(...op.f.operations)
                  // x = await op.f.runAsPromise(ctx)
                  // if (x.failure) {
                  //   throw x.failure
                  // }
                  // if (x.error) {
                  //   matchError(x.error)
                  // } else {
                  //   matchResult(x.result)
                  // }
                }
                break
              }
            }
          } else {
            switch (op._tag) {
              case Ops.bracket: {
                // x = await op.f[1](result).runAsPromise(context)
                // await op.f[0](result).runAsPromise(context)
                // if (x.failure) {
                //   throw x.failure
                // }
                // if (x.error) {
                //   matchError(x.error)
                // } else {
                //   matchResult(x.result)
                // }
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
                    matchError,
                    matchResult
                  )
                } else {
                  x = await op.f.runAsPromise(result)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    matchError(x.error)
                  } else {
                    matchResult(x.result)
                  }
                }
                break
              }
              case Ops.group: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    matchError,
                    matchGroupResult
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    matchError(x.error)
                  } else {
                    matchResult([result, x.result])
                  }
                }
                break
              }
              case Ops.groupFirst: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    matchError,
                    noChange
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    matchError(x.error)
                  }
                }
                break
              }
              case Ops.groupSecond: {
                if (typeof op.f === 'function') {
                  x = await op.f(ctx)
                  x.match(
                    matchError,
                    matchResult
                  )
                } else {
                  x = await op.f.runAsPromise(ctx)
                  if (x.failure) {
                    throw x.failure
                  }
                  if (x.error) {
                    matchError(x.error)
                  } else {
                    matchResult(x.result)
                  }
                }
                break
              }
              case Ops.flatMap: {
                // @ts-ignore
                stack.push(...toArray(op.f(result).operations as any) as any)
                break
              }
              case Ops.map: {
                result = op.f(result)
                break
              }
              case Ops.init: {
                x = await op.f(ctx)
                x.match(
                  matchError,
                  matchResult
                )
                break
              }
              case Ops.initValue: {
                result = op.f
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
