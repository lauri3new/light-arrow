/* eslint-disable */
// import { List } from 'immutable'
import { List, list } from '@funkia/list'
import { performance } from 'perf_hooks'
import { Either, Right } from '../either'

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
  // // depencendies
  provide: (_:D) => SafeArrow<{}, E, A>
  // // run
  runAsPromise: (
    context: D
  ) => Promise<{
    context: D,
    error: E
    result: A,
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
  let res: any
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
            let x
            if (typeof op.f === 'function') {
              x = await op.f(result)(ctx)
            } else {
              x = await op.f.runAsPromise(context)
            }
            if (x.error || x.failure) {
              isLeft = true
              error = x.error || x.failure
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
          res = await op.f(result)
        } else {
          res = await op.f.__val(result)
        }
        res.match(
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
          res = await op.f(result)
        } else {
          res = await op.f.__val(result)
        }
        res.match(
          (e: any) => {
            isLeft = true
            error = e
           },
          (r: any) => {
            result = [ result, r]
          }
        )
        break;
      }
      case Ops.groupFirst: {
        if (typeof op.f === 'function') {
          res = await op.f(result)
        } else {
          res = await op.f.__val(result)
        }
        res.match(
          (e: any) => {
            error = e
           },
          (r: any) => {}
        )
        break;
      }
      case Ops.groupSecond: {
        if (typeof op.f === 'function') {
          res = await op.f(result)
        } else {
          res = await op.f.__val(result)
        }
        res.match(
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
      case Ops.flatMap: {
        res = op.f(result)
        if (typeof res === 'function') {
          res = await res(ctx)
        } else {
          res = await res.__val(ctx)
        }
        result = res.__val
        break;
      }
      case Ops.map: {
        result = op.f(result)
        break;
      }
      case Ops.init: {
        res = await op.f(context)
        res.match(
          (e: any) => {
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
    provide(c:D): SafeArrow<{}, E, A> {
      return SafeArrow<{}, E, A>(undefined, operations, c)
    },
    async runAsPromiseResult(
      c: D
    ) {
      const {
        error,
        result,
        context
      } = await _run(c, operations)
      if (error) {
        throw error
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
      try {
        const {
          error,
          result,
          context
        } = await _run(c, operations)
        if (error) {
          mapError(error)
        }
        mapResult(result)
        if (handleContext) {
          handleContext(c)
        } 
      } catch (e) {
        handleFailure(e)
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
      } = await _run(c, operations)
      if (failure) {
        throw failure
      }
      return {
        result,
        error,
        context
      }
    }
  }
}

const sArrow = <D, E, A>(__val: (_:D) => Promise<Either<E, A>>):SafeArrow<D, E, A> => SafeArrow(__val)

let a = sArrow<unknown, any, number>(async () => Right(1))

const sleep = () => new Promise((res) => setTimeout(() => { res() }, 1))
console.log(performance.now())
for (let i = 0; i < 300000; i++)
{
  a = a.flatMap((c) => sArrow<any, any, number>(async () => Right(c + 1)))
}

a.run(
  {},
  (r) => {
    console.log(performance.now())
    console.log('wahoo', r)
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  },
  (e) => console.log('doh', e),
  (f) => console.log('uhoh', f),
  (c) => console.log('ctx', c)
)
setImmediate(() => console.log('hello'))