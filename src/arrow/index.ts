import { List, list } from '@funkia/list'
import { Either, Left, Right } from '../either'

// export interface Arrow<D, E, R> {
//   // monad
//   map: <R2>(f: (_:R) => R2) => Arrow<D, E, R2>
//   flatMap: <D2, E2, R2>(f: (_:R) => Arrow<D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
//   leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, R>
//   biMap: <E2, R2>(f: (_:E) => E2, g: (_:R) => R2) => Arrow<D, E2, R2>
//   // combinators
//   orElse: <D2, E2, R2>(f:Arrow<D2, E2, R2>) => Arrow<D & D2, E2, R | R2>
//   andThen: <E2, R2>(f: Arrow<R, E2, R2>) => Arrow<D, E | E2, R2>
//   group: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, [R, R2]>
//   groupFirst: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R>
//   groupSecond: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
//   // run
//   runAsPromise: (
//     context: D
//   ) => Promise<{
//     context: D,
//     error: E
//     result: R,
//     failure?: Error
//   }>
//   runAsPromiseResult: (
//     context: D
//   ) => Promise<R>
//   run: <R21, E2, F, D2>(
//     context: D,
//     mapResult: (_:R) => R21,
//     mapError: (_:E) => E2,
//     handleFailure?: (_: Error) => F,
//     handleContext?: (_:D) => D2
//   ) => void
//   // flatMapF
//   flatMapF: <D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
//   // combinatorsF
//   orElseF: <D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E2, R | R2>
//   andThenF: <E2, R2>(_:(_:R) => Promise<Either<E2, R2>>) => Arrow<D, E | E2, R2>
//   groupF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, [R, R2]>
//   groupFirstF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R>
//   groupSecondF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
// }

enum Ops {
  map = 1,
  flatMap = 2,
  leftMap = 3,
  andThen = 4,
  orElse = 5,
  group = 6,
  groupFirst = 7,
  groupSecond = 8,
  init = 9,
  all = 10
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

type all = {
  _tag: Ops.all
  f: Arrow<any, any, any>[]
  concurrencyLimit?: number
}

type Operation = map | leftMap | flatMap | orElse | group | andThen | groupFirst | groupSecond | init | all

const worker = (context: any) => async (iterator: IterableIterator<[number, Arrow<any, any, any>]>, context: any) => {
  let out = []
  let x: any
  for (let [index, item] of iterator) {
    x = await item.runAsPromiseResult(context)
    out.push(x)
  }
  return out
}

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
      case Ops.all: {
        if (op.concurrencyLimit) {
          let limit = op.f.length > op.concurrencyLimit ? op.concurrencyLimit : op.f.length
          let entries = op.f.entries()
          result = await Promise.all(new Array(limit).fill(entries).map(worker(context))).then((array) => array.flat())
        } else {
          result = await Promise.all(op.f.map(_f => _f.runAsPromiseResult(context)))
        }
      }
      break;
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

export class Arrow<D, E, R> {

  private ctx: any
  private operations: List<Operation>

  static all<D, E, R>(f: Arrow<D, E, R>[], concurrencyLimit?: number): Arrow<D, E, R[]> {
    return new Arrow<D, E, R[]>(undefined, list({
      _tag: Ops.all,
      f,
      concurrencyLimit
    }))
  }

  static of<D, E, R>(f: (_:D) => Promise<Either<E, R>>): Arrow<D, E, R> {
    return new Arrow(f)
  }

  private constructor(f?: (_:D) => Promise<Either<E, R>>, initialOps?: List<Operation>, initialContext?: any) {
    this.operations = initialOps ? initialOps : list<{ _tag: Ops, f: any  }>({
      _tag: Ops.init,
      f
    })
    this.ctx = initialContext
  }
  
  map<R2>(f: (_:R) => R2): Arrow<D, E, R2> {
    return new Arrow<D, E, R2>(undefined, this.operations.append({
      _tag: Ops.map,
      f
    }))
  }

  biMap<E2, R2>(f: (_:E) => E2, g: (_:R) => R2):Arrow<D, E2, R2> {
    return new Arrow<D, E2, R2>(undefined, this.operations.append({
      _tag: Ops.map,
      f: g
    }).append({
      _tag: Ops.leftMap,
      f
    }))
  }

  leftMap<E2>(f: (_:E) => E2): Arrow<D, E2, R> {
    return new Arrow<D, E2, R>(undefined, this.operations.append({
      _tag: Ops.leftMap,
      f
    }))
  }

  flatMap<D2, E2, R2>(f: (_:R) => Arrow<D2, E2, R2>): Arrow<D & D2, E | E2, R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.flatMap,
      f
    }))
  }

  //TODO fix flatMapF run
  flatMapF<D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E | E2, R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.flatMap,
      f: f as any
    }))
  }

  orElse<D2, E2, R2>(f:Arrow<D2, E2, R2>) {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.orElse,
      f
    }))
  }

  orElseF<D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>) {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.orElse,
      f
    }))
  }

  andThen<E2, R2>(f:Arrow<R, E2, R2>) {
    return new Arrow<D, E2, R2>(undefined, this.operations.append({
      _tag: Ops.andThen,
      f
    }))
  }

  andThenF<E2, R2>(f:(_:R) => Promise<Either<E2, R2>>) {
    return new Arrow<D, E2, R2>(undefined, this.operations.append({
      _tag: Ops.andThen,
      f
    }))
  }

  group<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) {
    return new Arrow<D & D2, E2, [R, R2]>(undefined, this.operations.append({
      _tag: Ops.group,
      f
    }))
  }

  groupF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) {
    return new Arrow<D & D2, E2, [R, R2]>(undefined, this.operations.append({
      _tag: Ops.group,
      f
    }))
  }

  groupFirst<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) {
    return new Arrow<D & D2, E2, R>(undefined, this.operations.append({
      _tag: Ops.groupFirst,
      f
    }))
  }

  groupFirstF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) {
    return new Arrow<D & D2, E2, R>(undefined, this.operations.append({
      _tag: Ops.groupFirst,
      f
    }))
  }

  groupSecond<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.groupSecond,
      f
    }))
  }

  groupSecondF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.groupSecond,
      f
    }))
  }

  async runAsPromiseResult(
    c: D
  ) {
    const {
      error,
      failure,
      result
    } = await _run(this.ctx || c, this.operations)
    if (error || failure) {
      throw error || failure
    }
    return result
  }

  async run<R21, E2, F, D2>(
    c: D,
    mapResult: (_:R) => R21,
    mapError: (_:E) => E2,
    handleFailure?: (_: Error) => F,
    handleContext?: (_:D) => D2
  ) {
      const {
        error,
        result,
        context,
        failure
      } = await _run(this.ctx || c, this.operations)
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
  }

  async runAsPromise(
    c: D
  ) {
      const {
        failure,
        error,
        result,
        context
      } = await _run(this.ctx || c, this.operations)
      return {
        result,
        error,
        context,
        failure
      }
    }
}

// constructors

export const arrow = <D, E, R>(f: (_:D) => Promise<Either<E, R>>): Arrow<D, E, R> => Arrow.of(f)

export const draw = <D, D2, E, R>(f: (_:D) => Arrow<D2, E, R>): Arrow<D & D2, E, R> => Arrow.of<D, never, D>(async a => Right(a)).flatMap(f)

export const drawAsync = <R, D = {}>(a:(_:D) => Promise<R>): Arrow<D, never, R> => Arrow.of((s: D) => a(s).then(Right))

export const drawFailableAsync = <R, D = {}, E = Error>(a:(_:D) => Promise<R>):Arrow<D, E, R> => Arrow.of((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

export const drawFunction = <R, D = {}>(a:(_:D) => R): Arrow<D, never, R> => Arrow.of((s:D) => Promise.resolve(Right(a(s))))

export const drawFailableFunction = <R, D = {}, E = Error>(a:(_:D) => R): Arrow<D, E, R> => Arrow.of((s:D) => {
  try {
    const r = a(s)
    return Promise.resolve(Right(r))
  } catch (e) {
    return Promise.resolve(Left(e))
  }
})

export const succeed = <R, D = {}>(a: R): Arrow<D, never, R> => Arrow.of(async (_:D) => Right(a))

export const fail = <E, D = {}>(a: E): Arrow<D, E, never> => Arrow.of(async (_:D) => Left(a))

export const drawNullable = <R>(
  a: R | null | undefined
): Arrow<{}, null, R> => arrow(async () => (a === undefined || a === null ? Left(null) : Right(a)))

export const drawEither = <E, R>(a:Either<E, R>):Arrow<{}, E, R> => Arrow.of(async (_:{}) => a)

// combinators

export const all = <D, E, R>(f: Arrow<D, E, R>[], concurrencyLimit?: number): Arrow<D, E, R[]> => {
  return Arrow.all(f, concurrencyLimit)
}

export function orElse <D1, E1, R1, D2, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>): Arrow<D1 & D2, E2, R1 | R2>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>): Arrow<D1 & D2 & D3, E3, R1 | R2 | R3>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>): Arrow<D1 & D2 & D3 & D4, E4, R1 | R2 | R3 | R4>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>): Arrow<D1 & D2 & D3 & D4 & D5, E5, R1 | R2 | R3 | R4 | R5>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6, E6, R1 | R2 | R3 | R4 | R5 | R6>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7, E7, R1 | R2 | R3 | R4 | R5 | R6 | R7>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>, h: Arrow<D8, E8, R8>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8, E8, R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>, h: Arrow<D8, E8, R8>, i: Arrow<D9, E9, R9>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 & D9, E9, R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9>
export function orElse(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].orElse(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return orElse(a.orElse(b), ...aas)
}

export function andThen <D1, E1, R1, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>): Arrow<D1, E1 | E2, R2>
export function andThen <D1, E1, R1, E2, R2, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>): Arrow<D1, E1 | E2 | E3, R3>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>): Arrow<D1, E1 | E2 | E3 | E4, R4>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, R5>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, R6>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, R7>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, R8>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>, i: Arrow<R8, E9, R9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, R9>
export function andThen(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].andThen(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return andThen(a.andThen(b), ...aas)
}

export const sequence = <D, E, R>(as: Arrow<D, E, R>[]): Arrow<D, E, R[]> => as.reduce(
  (acc, arrowR) => acc.flatMap((a) => arrowR.map(c => [...a, c] )), arrow<D, E, R[]>(async (_: D) => Right<R[]>([]))
)

export const retry = (n: number) => <D, E, R>(a: Arrow<D, E, R>): Arrow<D, E, R> => (n === 1 ? a : a.orElse(retry(n - 1)(a)))

export const repeat = (n: number) => <D, E, R>(a: Arrow<D, E, R>): Arrow<D, E, R> => (n === 1 ? a : a.groupSecond(repeat(n - 1)(a)))

// utility types

export type ArrowsRight<ARROW> = ARROW extends Arrow<any, any, infer R> ? R : never
export type ArrowsLeft<ARROW> = ARROW extends Arrow<any, infer E, any> ? E : never
export type ArrowsDependencies<ARROW> = ARROW extends Arrow<infer D, any, any> ? D : never
