/* eslint-disable */
// import { List } from 'immutable'
import { List, list } from '@funkia/list'
import { Either } from '../either'

interface SafeArrow<D, E, A> {
  // constructor
  __val: (_:D) => Promise<Either<E, A>>
  // monad
  map: <B>(f: (_:A) => B) => SafeArrow<D, E, B>
  flatMap: <D2, E2, B>(f: (_:A) => SafeArrow<D2, E2, B>) => SafeArrow<D & D2, E | E2, B>
  leftMap: <E2>(f: (_:E) => E2) => SafeArrow<D, E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => SafeArrow<D, E2, B>
  // // combinators
  orElse: <D2, E2, B>(f:SafeArrow<D2, E2, B>) => SafeArrow<D & D2, E2, A | B>
  andThen: <E2, B>(f: SafeArrow<A, E2, B>) => SafeArrow<D, E | E2, B>
  group: <D2, E2, B>(f:SafeArrow<Partial<D> & D2, E2, B>) => SafeArrow<D & D2, E | E2, [A, B]>
  groupFirst: <D2, E2, B>(f:SafeArrow<Partial<D>& D2, E2, B>) => SafeArrow<D & D2, E | E2, A>
  groupSecond: <D2, E2, B>(f:SafeArrow<Partial<D>& D2, E2, B>) => SafeArrow<D & D2, E | E2, B>
  // // run
  runAsPromise: (
    context: D
  ) => Promise<{
    context: D,
    error: E
    result: A,
    failure?: Error
  }>
  runAsPromiseResult: (
    context: D
  ) => Promise<A>
  run: <B1, E2, F, D2>(
    context: D,
    mapResult: (_:A) => B1,
    mapError: (_:E) => E2,
    handleFailure: (_?: Error) => F,
    handleContext?: (_:D) => D2
  ) => void
  // // flatMapF
  flatMapF: <D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) => SafeArrow<D & D2, E | E2, B>
  // // combinatorsF
  orElseF: <D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) => SafeArrow<D & D2, E2, A | B>
  andThenF: <E2, B>(_:(_:A) => Promise<Either<E2, B>>) => SafeArrow<D, E | E2, B>
  groupF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => SafeArrow<D & D2, E | E2, [A, B]>
  groupFirstF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => SafeArrow<D & D2, E | E2, A>
  groupSecondF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => SafeArrow<D & D2, E | E2, B>
}

enum Ops {
  map = 1,
  flatMap = 2,
  leftMap = 3,
  biMap = 4,
  andThen = 5,
  orElse = 6,
  group = 7,
  groupFirst = 8,
  groupSecond = 9,
  init = 10
}

async function _run(context: any, operations: List<{ _tag: Ops, f: any }>) {
  let result: any
  let x: any
  let isLeft: boolean = false
  let error: any
  let ctx = context || {}
  for (const op of operations) {
    try {
    if (error) {
      switch (op._tag) {
        case Ops.leftMap: {
          if (isLeft) {
            error = op.f(error) 
          }
          break;
        }
        case Ops.orElse: {
            isLeft = false
            error = undefined
            if (typeof op.f === 'function') {
              x = await op.f(ctx)
            } else {
              x = await op.f.runAsPromise(ctx)
            }
            if (x.failure) {
              throw x.failure
            }
            if (x.error) {
              isLeft = true
              error = x.error
            } else {
              result = x.result
            }
          break;
        }
      }
    } else {
    switch (op._tag) {
      case Ops.andThen: {
        if (typeof op.f === 'function') {
          x = await op.f(result)
        } else {
          x = await op.f.__val(result)
        }
        x.match(
          (e: any) => {
            isLeft = true
            error = e
           },
          (a: any) => {
            result = a
          }
        )
        break;
      }
      case Ops.group: {
        if (typeof op.f === 'function') {
          x = await op.f(ctx)
        } else {
          x = await op.f.runAsPromise(ctx)
        }
        if (x.failure) {
          throw x.failure
        }
        if (x.error) {
          isLeft = true
          error = x.error
        } else {
          result = [result, x.result]
        }
        break;
      }
      case Ops.groupFirst: {
        if (typeof op.f === 'function') {
          x = await op.f(ctx)
        } else {
          x = await op.f.runAsPromise(ctx)
        }
        if (x.failure) {
          throw x.failure
        }
        if (x.error) {
          isLeft = true
          error = x.error
        } else {
          result = result
        }
        break;
      }
      case Ops.groupSecond: {
        if (typeof op.f === 'function') {
          x = await op.f(ctx)
        } else {
          x = await op.f.runAsPromise(ctx)
        }
        if (x.failure) {
          throw x.failure
        }
        if (x.error) {
          isLeft = true
          error = x.error
        } else {
          result = x.result
        }
        break;
      }
      case Ops.flatMap: {
        x = op.f(result)
        if (typeof x === 'function') {
          x = await x(ctx)
        } else {
          x = await x.__val(ctx)
        }
        x.match(
          (e: any) => {
            isLeft = true
            error = e
           },
          (r: any) => {
            result = r
          }
        )
        break;
      }
      case Ops.map: {
        result = op.f(result)
        break;
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
        break;
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

function SafeArrow<D, E, A>(__val?: (_:D) => Promise<Either<E, A>>, initialOps?: List<any>, initialContext?: any):SafeArrow<D, E, A> {
  let operations = initialOps ? initialOps : list<{ _tag: Ops, f: any  }>({
    _tag: Ops.init,
    f: __val
  })
  let ctx: any = initialContext

  return {
    __val: __val ? __val : initialOps?.nth(0)?.f,
    map<B>(f: (_:A) => B):SafeArrow<D, E, B> {
      return SafeArrow<D, E, B>(undefined, operations.append({
        _tag: Ops.map,
        f
      }))
    },
    biMap<E2, B>(f: (_:E) => E2, g: (_:A) => B):SafeArrow<D, E2, B> {
      return SafeArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.map,
        f: g
      }).append({
        _tag: Ops.leftMap,
        f
      }))
    },
    leftMap<E2>(f: (_:E) => E2):SafeArrow<D, E2, A> {
      return SafeArrow<D, E2, A>(undefined, operations.append({
        _tag: Ops.leftMap,
        f
      }))
    },
    flatMap<D2, E2, B>(f: (_:A) => SafeArrow<D2, E2, B>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.flatMap,
        f
      }))
    },
    flatMapF<D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.flatMap,
        f
      }))
    },
    orElse<D2, E2, B>(f:SafeArrow<D2, E2, B>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.orElse,
        f
      }))
    },
    orElseF<D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.orElse,
        f
      }))
    },
    andThen<E2, B>(f:SafeArrow<A, E2, B>) {
      return SafeArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.andThen,
        f
      }))
    },
    andThenF<E2, B>(f:(_:A) => Promise<Either<E2, B>>) {
      return SafeArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.andThen,
        f
      }))
    },
    group<D2, E2, B>(f:SafeArrow<Partial<D> & D2, E2, B>) {
      return SafeArrow<D & D2, E2, [A, B]>(undefined, operations.append({
        _tag: Ops.group,
        f
      }))
    },
    groupF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SafeArrow<D & D2, E2, [A, B]>(undefined, operations.append({
        _tag: Ops.group,
        f
      }))
    },
    groupFirst<D2, E2, B>(f:SafeArrow<Partial<D> & D2, E2, B>) {
      return SafeArrow<D & D2, E2, A>(undefined, operations.append({
        _tag: Ops.groupFirst,
        f
      }))
    },
    groupFirstF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SafeArrow<D & D2, E2, A>(undefined, operations.append({
        _tag: Ops.groupFirst,
        f
      }))
    },
    groupSecond<D2, E2, B>(f:SafeArrow<Partial<D> & D2, E2, B>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.groupSecond,
        f
      }))
    },
    groupSecondF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SafeArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.groupSecond,
        f
      }))
    },
    async runAsPromiseResult(
      c: D
    ) {
      const {
        error,
        failure,
        result
      } = await _run(ctx || c, operations)
      if (error || failure) {
        throw error || failure
      }
      return result
    },
    async run<B1, E2, F, D2>(
      c: D,
      mapResult: (_:A) => B1,
      mapError: (_:E) => E2,
      handleFailure: (_?: Error) => F,
      handleContext?: (_:D) => D2
    ) {
        const {
          error,
          result,
          context,
          failure
        } = await _run(ctx || c, operations)
        if (failure) {
          handleFailure(failure)
        } else if (error) {
          mapError(error)
        } else {
          mapResult(result)
        }
        if (handleContext) {
          handleContext(context)
        }
    },
    async runAsPromise(
      c: D
    ) {
      const {
        failure,
        error,
        result,
        context
      } = await _run(ctx || c, operations)
      return {
        result,
        error,
        context,
        failure
      }
    }
  }
}

export const sArrow = <D, E, A>(__val: (_:D) => Promise<Either<E, A>>):SafeArrow<D, E, A> => SafeArrow(__val)
