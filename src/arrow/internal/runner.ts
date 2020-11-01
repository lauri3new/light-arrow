/* eslint-disable no-await-in-loop */
import { List, toArray } from '@funkia/list'
import { Operation, Ops, Runnable } from './operations'
import { runAsPromiseResult } from './runAsPromiseResult'
import { worker } from './worker'

export function runner(context: any, operations: List<Operation>) {
  const stack = toArray(operations)
  let cancellables: any[] = []
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
  const _run = (op: Runnable) => {
    switch (op._tag) {
      case Ops.promiseBased: {
        return op.f(ctx).then(x => {
          x.match(
            matchError,
            matchResult
          )
        })
      }
      case Ops.construct: {
        return new Promise((res, rej) => {
          let pending = true
          const resolve = (a: any) => {
            result = a
            pending = false
          }
          const reject = (a: any) => {
            isLeft = true
            error = a
            pending = false
          }
          try {
            const cancel = op.f(ctx)(resolve, reject)
            const check = () => {
              try {
                if (cancelled) {
                  pending = false
                  // eslint-disable-next-line no-unused-expressions
                  cancel && cancel()
                }
                if (!pending) {
                  res()
                }
                if (pending) {
                  setImmediate(() => {
                    check()
                  })
                }
              } catch (e) {
                rej(e)
              }
            }
            check()
          } catch (e) {
            rej(e)
          }
        })
      }
    }
  }

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
            hasError: false,
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
                  x = await op.f(ctx)
                  x.match(
                    matchError,
                    matchResult
                  )
                } else {
                  stack.push(...op.f.__ops)
                }
                break
              }
            }
          } else {
            switch (op._tag) {
              case Ops.construct: {
                await _run(op)
                break
              }
              case Ops.bracket: {
                x = await op.f[1](result).runAsPromise(context)
                await op.f[0](result).runAsPromise(context)
                if (x.failure) {
                  throw x.failure
                }
                if (x.error) {
                  matchError(x.error)
                } else {
                  matchResult(x.result)
                }
                break
              }
              case Ops.all:
                try {
                  if (op.concurrencyLimit) {
                    const limit = op.f.length > op.concurrencyLimit ? op.concurrencyLimit : op.f.length
                    // eslint-disable-next-line no-loop-func
                    const entries = op.f.map(_f => {
                      const _runner = runner(context, _f.__ops)
                      cancellables.push(_runner.cancel)
                      return _runner
                    }).entries()
                    // eslint-disable-next-line no-loop-func
                    result = await Promise.all(new Array(limit).fill(entries).map(worker)).then((array) => array.flat())
                  } else {
                    // eslint-disable-next-line no-loop-func
                    result = await Promise.all(op.f.map(async _f => {
                      const a = runner(context, _f.__ops)
                      cancellables.push(a.cancel)
                      return runAsPromiseResult(a)
                    }))
                    cancellables = []
                  }
                } catch (e) {
                  while (cancellables[0]) {
                    cancellables.pop()()
                  }
                  if (e.tag === 'error') {
                    matchError(e.value)
                  } else {
                    throw e.value
                  }
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
                  stack.push(...toArray(op.f.__ops as any) as any)
                }
                break
              }
              case Ops.flatMap: {
                x = op.f(result)
                if (typeof x === 'function') {
                  x = await x(ctx)
                  x.match(
                    matchError,
                    matchResult
                  )
                } else {
                  stack.push(...toArray(x.__ops as any) as any)
                }
                break
              }
              case Ops.map: {
                result = op.f(result)
                break
              }
              case Ops.promiseBased: {
                await _run(op)
                break
              }
              case Ops.value: {
                result = op.f
                break
              }
            }
          }
        } catch (e) {
          console.log('huh')
          return {
            hasError: isLeft,
            failure: e,
            error,
            result,
            context
          }
        }
      }
      return {
        hasError: isLeft,
        error,
        result,
        context
      }
    }
  }
}

export type Runner = ReturnType<typeof runner>
