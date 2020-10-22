import { List, list } from '@funkia/list'
import { Either, Left, Right } from '../either'

export interface Arrow<D, E, A> {
  // monad
  map: <B>(f: (_:A) => B) => Arrow<D, E, B>
  flatMap: <D2, E2, B>(f: (_:A) => Arrow<D2, E2, B>) => Arrow<D & D2, E | E2, B>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<D, E2, B>
  // combinators
  orElse: <D2, E2, B>(f:Arrow<D2, E2, B>) => Arrow<D & D2, E2, A | B>
  andThen: <E2, B>(f: Arrow<A, E2, B>) => Arrow<D, E | E2, B>
  group: <D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) => Arrow<D & D2, E | E2, [A, B]>
  groupFirst: <D2, E2, B>(f:Arrow<Partial<D>& D2, E2, B>) => Arrow<D & D2, E | E2, A>
  groupSecond: <D2, E2, B>(f:Arrow<Partial<D>& D2, E2, B>) => Arrow<D & D2, E | E2, B>
  // run
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
    handleFailure?: (_: Error) => F,
    handleContext?: (_:D) => D2
  ) => void
  // flatMapF
  flatMapF: <D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>
  // combinatorsF
  orElseF: <D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E2, A | B>
  andThenF: <E2, B>(_:(_:A) => Promise<Either<E2, B>>) => Arrow<D, E | E2, B>
  groupF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, [A, B]>
  groupFirstF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, A>
  groupSecondF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>
}

enum Ops {
  map = 1,
  flatMap = 2,
  leftMap = 3,
  andThen = 4,
  orElse = 5,
  group = 6,
  groupFirst = 7,
  groupSecond = 8,
  init = 9
}

type map = {
  _tag: Ops.map
  f: (result: any) => any
}

type leftMap = {
  _tag: Ops.leftMap
  f: (error: any) => any
}

type orElse = {
  _tag: Ops.orElse
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type andThen = {
  _tag: Ops.andThen
  f: Arrow<any, any, any> | ((result: any) => Promise<Either<any, any>>)
}

type group = {
  _tag: Ops.group
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type groupFirst = {
  _tag: Ops.groupFirst
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type groupSecond = {
  _tag: Ops.groupSecond
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type flatMap = {
  _tag: Ops.flatMap
  f: (result: any) => Arrow<any, any, any> | ((result: any) => (context: any) => Promise<Either<any, any>>)
}

type init = {
  _tag: Ops.init
  f: (context: any) => Promise<Either<any, any>>
}

type Operation = map | leftMap | flatMap | orElse | group | andThen | groupFirst | groupSecond | init

async function _run(context: any, operations: List<Operation>) {
  let result: any
  let x: any
  let isLeft: boolean = false
  let error: any
  let ctx = context || {}
  for (const op of operations) {
    try {
    if (isLeft) {
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
          break;
        }
      }
    } else {
    switch (op._tag) {
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
        break;
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
        break;
      }
      case Ops.groupFirst: {
        if (typeof op.f === 'function') {
          x = await op.f(ctx)
          x.match(
            (e: any) => {
              isLeft = true
              error = e
             },
            (r: any) => {
              result = result
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
            result = result
          }
        }
        break;
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
        break;
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

function SArrow<D, E, A>(f?: (_:D) => Promise<Either<E, A>>, initialOps?: List<any>, initialContext?: any):Arrow<D, E, A> {
  let operations = initialOps ? initialOps : list<{ _tag: Ops, f: any  }>({
    _tag: Ops.init,
    f
  })
  let ctx: any = initialContext
  return {
    map<B>(f: (_:A) => B):Arrow<D, E, B> {
      return SArrow<D, E, B>(undefined, operations.append({
        _tag: Ops.map,
        f
      }))
    },
    biMap<E2, B>(f: (_:E) => E2, g: (_:A) => B):Arrow<D, E2, B> {
      return SArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.map,
        f: g
      }).append({
        _tag: Ops.leftMap,
        f
      }))
    },
    leftMap<E2>(f: (_:E) => E2):Arrow<D, E2, A> {
      return SArrow<D, E2, A>(undefined, operations.append({
        _tag: Ops.leftMap,
        f
      }))
    },
    flatMap<D2, E2, B>(f: (_:A) => Arrow<D2, E2, B>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.flatMap,
        f
      }))
    },
    flatMapF<D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.flatMap,
        f
      }))
    },
    orElse<D2, E2, B>(f:Arrow<D2, E2, B>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.orElse,
        f
      }))
    },
    orElseF<D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.orElse,
        f
      }))
    },
    andThen<E2, B>(f:Arrow<A, E2, B>) {
      return SArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.andThen,
        f
      }))
    },
    andThenF<E2, B>(f:(_:A) => Promise<Either<E2, B>>) {
      return SArrow<D, E2, B>(undefined, operations.append({
        _tag: Ops.andThen,
        f
      }))
    },
    group<D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) {
      return SArrow<D & D2, E2, [A, B]>(undefined, operations.append({
        _tag: Ops.group,
        f
      }))
    },
    groupF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SArrow<D & D2, E2, [A, B]>(undefined, operations.append({
        _tag: Ops.group,
        f
      }))
    },
    groupFirst<D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) {
      return SArrow<D & D2, E2, A>(undefined, operations.append({
        _tag: Ops.groupFirst,
        f
      }))
    },
    groupFirstF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SArrow<D & D2, E2, A>(undefined, operations.append({
        _tag: Ops.groupFirst,
        f
      }))
    },
    groupSecond<D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
        _tag: Ops.groupSecond,
        f
      }))
    },
    groupSecondF<D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) {
      return SArrow<D & D2, E2, B>(undefined, operations.append({
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
      handleFailure?: (_: Error) => F,
      handleContext?: (_:D) => D2
    ) {
        const {
          error,
          result,
          context,
          failure
        } = await _run(ctx || c, operations)
        if (failure) {
          if (handleFailure) {
            handleFailure(failure)
          } else {
            throw failure
          }
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

// type aliases and constructors

export type TaskEither<E, A> = Arrow<{}, E, A>
export type Task<A> = Arrow<{}, never, A>

// constructors

export const Arrow = <D, E, A>(f: (_:D) => Promise<Either<E, A>>):Arrow<D, E, A> => SArrow(f)

export type Draw<D, A, B, C> = (a: (A)) => Arrow<D, B, C>

export const drawAsync = <A, D = {}>(a:(_:D) => Promise<A>):Arrow<D, never, A> => Arrow((s: D) => a(s).then(Right))

export const drawFailableAsync = <A, D = {}, E = Error>(a:(_:D) => Promise<A>):Arrow<D, E, A> => Arrow((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

export const drawFunction = <A, D = {}>(a:(_:D) => A):Arrow<D, never, A> => Arrow((s:D) => Promise.resolve(Right(a(s))))

export const drawFailableFunction = <A, D = {}, E = Error>(a:(_:D) => A):Arrow<D, E, A> => Arrow((s:D) => {
  try {
    const r = a(s)
    return Promise.resolve(Right(r))
  } catch (e) {
    return Promise.resolve(Left(e))
  }
})

export const succeed = <A, D = {}>(a: A) => Arrow(async (_:D) => Right(a))

export const fail = <E, D = {}>(a: E):Arrow<D, E, never> => Arrow(async (_:D) => Left(a))

export const drawNullable = <A>(
  a: A | null | undefined
): TaskEither<null, A> => Arrow(async () => (a === undefined || a === null ? Left(null) : Right(a)))

export const drawEither = <E, A>(a:Either<E, A>):TaskEither<E, A> => Arrow(async (_:{}) => a)

// combinators

export function orElse <D1, E1, A1, D2, E2, A2>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>): Arrow<D1 & D2, E2, A1 | A2>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>): Arrow<D1 & D2 & D3, E3, A1 | A2 | A3>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>): Arrow<D1 & D2 & D3 & D4, E4, A1 | A2 | A3 | A4>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>): Arrow<D1 & D2 & D3 & D4 & D5, E5, A1 | A2 | A3 | A4 | A5>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6, E6, A1 | A2 | A3 | A4 | A5 | A6>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7, E7, A1 | A2 | A3 | A4 | A5 | A6 | A7>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>, h: Arrow<D8, E8, A8>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8, E8, A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8, D9, E9, A9>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>, h: Arrow<D8, E8, A8>, i: Arrow<D9, E9, A9>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 & D9, E9, A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9>
export function orElse(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].orElse(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return orElse(a.orElse(b), ...aas)
}

export function andThen <D1, E1, A1, E2, A2>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>): Arrow<D1, E1 | E2, A2>
export function andThen <D1, E1, A1, E2, A2, E3, A3>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>): Arrow<D1, E1 | E2 | E3, A3>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>): Arrow<D1, E1 | E2 | E3 | E4, A4>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, A5>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, A6>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, A7>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>, h: Arrow<A7, E8, A8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, A8>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8, D9, E9, A9>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>, h: Arrow<A7, E8, A8>, i: Arrow<A8, E9, A9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, A9>
export function andThen(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].andThen(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return andThen(a.andThen(b), ...aas)
}

export const sequence = <D, B, C>(as: Arrow<D, B, C>[]): Arrow<D, B, C[]> => as.reduce(
  (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c] )), Arrow<D, B, C[]>(async (_: D) => Right<C[]>([]))
)

export const retry = (n: number) => <D, B, C>(a: Arrow<D, B, C>): Arrow<D, B, C> => (n === 1 ? a : a.orElse(retry(n - 1)(a)))

export const repeat = (n: number) => <D, B, C>(a: Arrow<D, B, C>): Arrow<D, B, C> => (n === 1 ? a : a.groupSecond(repeat(n - 1)(a)))

// utility types

export type ArrowsRight<ARROW> = ARROW extends Arrow<any, any, infer A> ? A : never
export type ArrowsLeft<ARROW> = ARROW extends Arrow<any, infer E, any> ? E : never
export type ArrowsDependencies<ARROW> = ARROW extends Arrow<infer D, any, any> ? D : never
