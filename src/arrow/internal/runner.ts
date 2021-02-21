/* eslint-disable no-await-in-loop, no-loop-func, no-unused-expressions */
import { Operation, Ops, Runnable } from './operations'
import { runAsPromiseResult } from './runAsPromiseResult'
import { Stack } from './stack'
import { worker } from './worker'

export function runner(context: any, operations: Stack<Operation>) {
  const stack = operations.toArray()
  let cancellables: any[] = []
  let cancelled = false
  let result: any
  let x: any
  let isLeft: boolean = false
  let error: any
  let ctx = context || {}

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
        return new Promise((res) => {
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
          const cancel = op.f(ctx)(resolve, reject)
          const check = () => {
            if (cancelled) {
              pending = false
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
          }
          check()
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
              case Ops.leftFlatMap: {
                x = op.f(error)
                ctx = { ...ctx, ...x.__ctx }
                x = await op.f(error).runAsPromise(ctx)
                error = x.result
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
                  ctx = { ...ctx, ...op.f.__ctx }
                  stack.push(...op.f.__ops.toArray())
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
                x = op.f[1](result)
                x = await x.runAsPromise({ ...ctx, ...x.__ctx })
                let a = op.f[0](result)
                await a.runAsPromise({ ...ctx, ...a.__ctx })
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
                    const entries = op.f.map(_f => {
                      const _runner = runner(context, _f.__ops)
                      cancellables.push(_runner.cancel)
                      return _runner
                    }).entries()
                    result = await Promise.all(new Array(limit).fill(entries).map(worker)).then((array) => array.flat())
                  } else {
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
                result = await Promise.race(op.f.map(_f => _f.runAsPromiseResult({ ...ctx, ..._f.__ctx })))
                break
              case Ops.andThen: {
                if (typeof op.f === 'function') {
                  x = await op.f(result)
                  x.match(
                    matchError,
                    matchResult
                  )
                } else {
                  ctx = { ...ctx, ...op.f.__ctx }
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
                  x = await op.f.runAsPromise({ ...ctx, ...op.f.__ctx })
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
                  x = await op.f.runAsPromise({ ...ctx, ...op.f.__ctx })
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
                  ctx = { ...ctx, ...op.f.__ctx }
                  stack.push(...op.f.__ops.toArray())
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
                  ctx = { ...ctx, ...x.__ctx }
                  stack.push(...x.__ops.toArray())
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
