import { first, List, list, prepend } from '@funkia/list'
import { Either } from '../either'
import { Operation, Ops } from './internal/operations'
import { runner } from './internal/runner'

export interface Arrow<D, E, R> {
  operations: List<Operation>
  // monad
  map: <R2>(f: (_:R) => R2) => Arrow<D, E, R2>
  flatMap: <D2, E2, R2>(f: (_:R) => Arrow<D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, R>
  biMap: <E2, R2>(f: (_:E) => E2, g: (_:R) => R2) => Arrow<D, E2, R2>
  // combinators
  orElse: <D2, E2, R2>(f:Arrow<D2, E2, R2>) => Arrow<D & D2, E2, R | R2>
  andThen: <E2, R2>(f: Arrow<R, E2, R2>) => Arrow<D, E | E2, R2>
  group: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, [R, R2]>
  groupFirst: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R>
  groupSecond: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
  groupParallel:<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, [R, R2]>
  bracket:<D2>(f: (_:R) => Arrow<D2, never, any>) => <D3, E2, R2>(g: (_:R) => Arrow<D3, E2, R2>) => Arrow<D & D2 & D3, E | E2, R2>
  // run
  runAsPromise: (
    context: D
  ) => Promise<{
    context: D,
    error: E
    result: R,
    failure?: Error
  }>
  runAsPromiseResult: (
    context: D
  ) => Promise<R>
  run: <R21, E2, F, D2>(
    context: D,
    mapResult: (_:R) => R21,
    mapError: (_:E) => E2,
    handleFailure?: (_: Error) => F,
    handleContext?: (_:D) => D2
  ) => () => void
  // flatMapF
  flatMapF: <D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
  // combinatorsF
  orElseF: <D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E2, R | R2>
  andThenF: <E2, R2>(_:(_:R) => Promise<Either<E2, R2>>) => Arrow<D, E | E2, R2>
  groupF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, [R, R2]>
  groupFirstF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R>
  groupSecondF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
}

class InternalArrow<D, E, R> {
  private ctx: any

  public operations: List<Operation>

  static all<D, E, R>(f: Arrow<D, E, R>[], concurrencyLimit?: number): Arrow<D, E, R[]> {
    return new InternalArrow<D, E, R[]>(undefined, list({
      _tag: Ops.all,
      f,
      concurrencyLimit
    }))
  }

  static race<D, E, R>(f: Arrow<D, E, R>[]): Arrow<D, E, R> {
    return new InternalArrow<D, E, R>(undefined, list({
      _tag: Ops.race,
      f
    }))
  }

  static of<D, E, R>(f: (_:D) => Promise<Either<E, R>>): Arrow<D, E, R> {
    return new InternalArrow(f)
  }

  static resolve<R, D = {}>(f: R): Arrow<D, never, R> {
    return new InternalArrow(undefined, list({
      _tag: Ops.initValue,
      f
    })) as any
  }

  private constructor(f?: (_:D) => Promise<Either<E, R>>, initialOps?: List<Operation>, initialContext?: any) {
    this.operations = initialOps || list<{ _tag: Ops, f: any }>({
      _tag: Ops.init,
      f
    })
    this.ctx = initialContext
  }

  map<R2>(f: (_:R) => R2): Arrow<D, E, R2> {
    if (first(this.operations)?._tag === Ops.initValue) {
      return new InternalArrow<D, E, R2>(undefined, list({
        _tag: Ops.initValue,
        f: f(first(this.operations)?.f)
      }))
    }
    return new InternalArrow<D, E, R2>(undefined, prepend({
      _tag: Ops.map,
      f
    },
    this.operations))
  }

  biMap<E2, R2>(f: (_:E) => E2, g: (_:R) => R2): Arrow<D, E2, R2> {
    return new InternalArrow<D, E2, R2>(undefined, prepend({
      _tag: Ops.map,
      f: g
    },
    prepend({
      _tag: Ops.leftMap,
      f
    },
    this.operations)))
  }

  leftMap<E2>(f: (_:E) => E2): Arrow<D, E2, R> {
    return new InternalArrow<D, E2, R>(undefined, prepend({
      _tag: Ops.leftMap,
      f
    },
    this.operations))
  }

  flatMap<D2, E2, R2>(f: (_:R) => Arrow<D2, E2, R2>): Arrow<D & D2, E | E2, R2> {
    if (first(this.operations)?._tag === Ops.initValue) {
      return f(first(this.operations)?.f) as any
    }
    return new InternalArrow<D & D2, E2, R2>(undefined, prepend({
      _tag: Ops.flatMap,
      f
    },
    this.operations))
  }

  race<D, E, R>(f: Arrow<D, E, R>): Arrow<D, E, R> {
    return new InternalArrow<D, E, R>(undefined, list({
      _tag: Ops.race,
      f: [this, f]
    }))
  }

  groupParallel<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E | E2, [R, R2]> {
    return new InternalArrow<D & D2, E2, [R, R2]>(undefined, list({
      _tag: Ops.all,
      f: [this, f]
    }))
  }

  flatMapF<D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E | E2, R2> {
    return new InternalArrow<D & D2, E2, R2>(undefined, prepend({
      _tag: Ops.flatMap,
      f: f as any
    },
    this.operations))
  }

  orElse<D2, E2, R2>(f:Arrow<D2, E2, R2>): Arrow<D & D2, E2, R | R2> {
    return new InternalArrow<D & D2, E2, R | R2>(undefined, prepend({
      _tag: Ops.orElse,
      f
    },
    this.operations))
  }

  orElseF<D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R | R2> {
    return new InternalArrow<D & D2, E2, R | R2>(undefined, prepend({
      _tag: Ops.orElse,
      f
    },
    this.operations))
  }

  andThen<E2, R2>(f:Arrow<R, E2, R2>): Arrow<D, E | E2, R2> {
    return new InternalArrow<D, E2, R2>(undefined, prepend({
      _tag: Ops.andThen,
      f
    },
    this.operations))
  }

  andThenF<E2, R2>(f:(_:R) => Promise<Either<E2, R2>>): Arrow<D, E | E2, R2> {
    return new InternalArrow<D, E2, R2>(undefined, prepend({
      _tag: Ops.andThen,
      f
    },
    this.operations))
  }

  group<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E | E2, [R, R2]> {
    return new InternalArrow<D & D2, E2, [R, R2]>(undefined, prepend({
      _tag: Ops.group,
      f
    }, this.operations))
  }

  groupF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E | E2, [R, R2]> {
    return new InternalArrow<D & D2, E2, [R, R2]>(undefined, prepend({
      _tag: Ops.group,
      f
    }, this.operations))
  }

  groupFirst<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E | E2, R> {
    return new InternalArrow<D & D2, E2, R>(undefined, prepend({
      _tag: Ops.groupFirst,
      f
    }, this.operations))
  }

  groupFirstF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R> {
    return new InternalArrow<D & D2, E2, R>(undefined, prepend({
      _tag: Ops.groupFirst,
      f
    }, this.operations))
  }

  groupSecond<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>): Arrow<D & D2, E2, R2> {
    return new InternalArrow<D & D2, E2, R2>(undefined, prepend({
      _tag: Ops.groupSecond,
      f
    }, this.operations))
  }

  groupSecondF<D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>): Arrow<D & D2, E2, R2> {
    return new InternalArrow<D & D2, E2, R2>(undefined, prepend({
      _tag: Ops.groupSecond,
      f
    }, this.operations))
  }

  bracket<D2>(f: (_:R) => Arrow<D2, never, any>) {
    return <D3, E2, R2>(g: (_:R) => Arrow<D3, E2, R2>): Arrow<D & D2 & D3, E | E2, R2> => new InternalArrow<D & D2 & D3, E2, R2>(undefined, prepend({
      _tag: Ops.bracket,
      f: [f, g]
    }, this.operations))
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

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Arrow = <D, E, R>(f: (_:D) => Promise<Either<E, R>>): Arrow<D, E, R> => InternalArrow.of(f)

export const all = <D, E, R>(f: Arrow<D, E, R>[], concurrencyLimit?: number): Arrow<D, E, R[]> => InternalArrow.all(f, concurrencyLimit)

export const race = <D, E, R>(f: Arrow<D, E, R>[]): Arrow<D, E, R> => InternalArrow.race(f)

export const resolve = <R, D = {}>(a: R): Arrow<D, never, R> => InternalArrow.resolve(a)
