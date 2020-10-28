import { List, list } from '@funkia/list'
import { Either } from '../either'
import { Operation, Ops } from './internal/operations'
import { runner } from './internal/runner'

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

  static race<D, E, R>(f: Arrow<D, E, R>[]): Arrow<D, E, R> {
    return new Arrow<D, E, R>(undefined, list({
      _tag: Ops.race,
      f
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

  biMap<E2, R2>(f: (_:E) => E2, g: (_:R) => R2): Arrow<D, E2, R2> {
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

  race<D, E, R>(f: Arrow<D, E, R>): Arrow<D, E, R> {
    return new Arrow<D, E, R>(undefined, list({
      _tag: Ops.race,
      f: [this, f]
    }))
  }

  groupParallel<D, E, R>(f: Arrow<D, E, R>): Arrow<D, E, R> {
    return new Arrow<D, E, R>(undefined, list({
      _tag: Ops.all,
      f: [this, f]
    }))
  }

  flatMapF<D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E | E2, R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.flatMap,
      f: f as any
    }))
  }

  orElse<D2, E2, R2>(f:Arrow<D2, E2, R2>): Arrow<D & D2, E2, R | R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.orElse,
      f
    }))
  }

  orElseF<D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R | R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.orElse,
      f
    }))
  }

  andThen<E2, R2>(f:Arrow<R, E2, R2>): Arrow<D, E | E2, R2> {
    return new Arrow<D, E2, R2>(undefined, this.operations.append({
      _tag: Ops.andThen,
      f
    }))
  }

  andThenF<E2, R2>(f:(_:R) => Promise<Either<E2, R2>>): Arrow<D, E | E2, R2> {
    return new Arrow<D, E2, R2>(undefined, this.operations.append({
      _tag: Ops.andThen,
      f
    }))
  }

  group<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E | E2, [R, R2]> {
    return new Arrow<D & D2, E2, [R, R2]>(undefined, this.operations.append({
      _tag: Ops.group,
      f
    }))
  }

  groupF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E | E2, [R, R2]> {
    return new Arrow<D & D2, E2, [R, R2]>(undefined, this.operations.append({
      _tag: Ops.group,
      f
    }))
  }

  groupFirst<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E | E2, R> {
    return new Arrow<D & D2, E2, R>(undefined, this.operations.append({
      _tag: Ops.groupFirst,
      f
    }))
  }

  groupFirstF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R> {
    return new Arrow<D & D2, E2, R>(undefined, this.operations.append({
      _tag: Ops.groupFirst,
      f
    }))
  }

  groupSecond<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E2, R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.groupSecond,
      f
    }))
  }

  groupSecondF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R2> {
    return new Arrow<D & D2, E2, R2>(undefined, this.operations.append({
      _tag: Ops.groupSecond,
      f
    }))
  }

  bracket<D2>(f: (_:R) => Arrow<D2, never, any>) {
    return <D3, E2, R2>(g: (_:R) => Arrow<D3, E2, R2>): Arrow<D & D2 & D3, E | E2, R2> => new Arrow<D & D2 & D3, E2, R2>(undefined, this.operations.append({
      _tag: Ops.bracket,
      f: [f, g]
    }))
  }

  async runAsPromiseResult(
    c: D
  ) {
    const {
      error,
      failure,
      result
    } = await runner(this.ctx || c, this.operations).run()
    if (error || failure) {
      throw error || failure
    }
    return result
  }

  run<R21, E2, F, D2>(
    c: D,
    mapResult: (_:R) => R21,
    mapError: (_:E) => E2,
    handleFailure?: (_: Error) => F,
    handleContext?: (_:D) => D2
  ) {
      const _runner = runner(this.ctx || c, this.operations)
      setImmediate(() => {
        _runner.run().then(({
          error,
          result,
          context,
          failure
        }) => {
          if (!_runner.cancelled()) {
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
        })
      })
      return () => _runner.cancel()
    }

  async runAsPromise(
    c: D
  ) {
      const {
        failure,
        error,
        result,
        context
      } = await runner(this.ctx || c, this.operations).run()
      return {
        result,
        error,
        context,
        failure
      }
    }
}
