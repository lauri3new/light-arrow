/* eslint-disable @typescript-eslint/no-redeclare */
import {
  first, List, list, prepend
} from '@funkia/list'
import { Either } from '../either'
import { Operation, Ops } from './internal/operations'
import { runAsPromiseResult } from './internal/runAsPromiseResult'
import { runner } from './internal/runner'

/**
 * Arrows are data structures that describe asynchronous operations that can succeed with a result value R or fail with a value E that depends on some dependencies D.
 */
export interface Arrow<D, E, R> {
  /**
  * This is an internal property, an immutable stack of the current operations.
  */
  __ops: List<Operation>
  /**
  * Returns an Arrow with the result value mapped by the function f.
  */
  map: <R2>(f: (_:R) => R2) => Arrow<D, E, R2>
  /**
  * Returns a new Arrow requiring the dependencies of the first Arrow & the second Arrow, by passing the result of the first Arrow to the function f.
  */
  flatMap: <D2, E2, R2>(f: (_:R) => Arrow<D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
  /**
  * Returns an Arrow with the error value mapped by the function f.
  */
  leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, R>
  /**
  * Returns an Arrow with the error value mapped by the function f, and the result value mapped by function g.
  */
  biMap: <E2, R2>(f: (_:E) => E2, g: (_:R) => R2) => Arrow<D, E2, R2>
  /**
  * Returns an Arrow that will run the second arrow if the first fails.
  */
  orElse: <D2, E2, R2>(f:Arrow<D2, E2, R2>) => Arrow<D & D2, E2, R | R2>
  /**
  * Provides the result of the first Arrow as the dependencies of the next Arrow, allowing 'start to end' composition.
  */
  andThen: <E2, R2>(f: Arrow<R, E2, R2>) => Arrow<D, E | E2, R2>
  /**
  * Returns an Arrow with the result values in a tuple of the two grouped Arrows.
  */
  group: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, [R, R2]>
  /**
  * Returns an Arrow with the first result value of the two grouped Arrows.
  */
  groupFirst: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R>
  /**
  * Returns an Arrow with the second result value of the two grouped Arrows.
  */
  groupSecond: <D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, R2>
  /**
  * Returns an Arrow with the result values in a tuple of the two grouped Arrows, running the operations in parallel.
  */
  groupParallel:<D2, E2, R2>(f:Arrow<Partial<D> & D2, E2, R2>) => Arrow<D & D2, E | E2, [R, R2]>
  /**
  * bracket is useful for modelling effects that consume resources that are used and then released, it accepts a 'release' function that always executes after the second argument 'usage' function has executed, regardless of if it has failed or succeeded. The return type is an Arrow with the result type determined by the 'usage' function.
  */
  bracket:<D2>(f: (_:R) => Arrow<D2, never, any>) => <D3, E2, R2>(g: (_:R) => Arrow<D3, E2, R2>) => Arrow<D & D2 & D3, E | E2, R2>
  /**
  * Executes this Arrow, returning a promise with an object of the outcomes.
  */
  runAsPromise: (
    context: D
  ) => Promise<{
    hasError: boolean,
    context: D,
    error: E
    result: R,
    failure?: Error
  }>
  /**
  * Unsafely executes this Arrow, returning a promise with the result or throwing an Error with an object of type `{ tag: 'error' | 'failure' , value: E | Error }` in an error or exception case.
  */
  runAsPromiseResult: (
    context: D
  ) => Promise<R>
  /**
  * Executes this Arrow with the given handler functions, returning a cancel function.
  */
  run: <R21, E2, F, D2>(
    context: D,
    mapResult: (_:R) => R21,
    mapError: (_:E) => E2,
    handleFailure?: (_: Error) => F,
    handleContext?: (_:D) => D2
  ) => () => void
  /**
  * Like flatmap but accepts a function returning a Promise<Either>.
  */
  flatMapF: <D2, E2, R2>(f: (_:R) => (_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
  /**
  * Like orElse but accepts a function returning a Promise<Either>.
  */
  orElseF: <D2, E2, R2>(f:(_:D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E2, R | R2>
  /**
  * Like andThen but accepts a function returning a Promise<Either>.
  */
  andThenF: <E2, R2>(_:(_:R) => Promise<Either<E2, R2>>) => Arrow<D, E | E2, R2>
  /**
  * Like group but accepts a function returning a Promise<Either>.
  */
  groupF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, [R, R2]>
  /**
  * Like groupFirst but accepts a function returning a Promise<Either>.
  */
  groupFirstF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R>
  /**
  * Like groupSecond but accepts a function returning a Promise<Either>.
  */
  groupSecondF: <D2, E2, R2>(f:(_:Partial<D> & D2) => Promise<Either<E2, R2>>) => Arrow<D & D2, E | E2, R2>
}

class InternalArrow<D, E, R> {
  private ctx: any

  private operations: List<Operation>

  public get __ops(): List<Operation> {
    return this.operations
  }

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
      _tag: Ops.value,
      f
    })) as any
  }

  // TODO: reader D
  static construct<D, E, R>(f: (_: D) => (resolve: (_: R) => void, reject: (_: E) => void) => void | (() => void)): Arrow<D, E, R> {
    return new InternalArrow(undefined, list({
      _tag: Ops.construct,
      f
    }))
  }

  private constructor(f?: (_:D) => Promise<Either<E, R>>, initialOps?: List<Operation>, initialContext?: any) {
    this.operations = initialOps || list<{ _tag: Ops, f: any }>({
      _tag: Ops.promiseBased,
      f
    })
    this.ctx = initialContext
  }

  map<R2>(f: (_:R) => R2): Arrow<D, E, R2> {
    if (first(this.operations)?._tag === Ops.value) {
      return new InternalArrow<D, E, R2>(undefined, list({
        _tag: Ops.value,
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
    if (first(this.operations)?._tag === Ops.value) {
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
    const r = runner(this.ctx || c, this.operations)
    return runAsPromiseResult(r)
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
        hasError,
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
          } else if (hasError) {
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
      hasError,
      failure,
      error,
      result,
      context
    } = await runner(this.ctx || c, this.operations).run()
    return {
      result,
      hasError,
      error,
      context,
      failure
    }
  }
}

export const Arrow = <D, E, R>(f: (_:D) => Promise<Either<E, R>>): Arrow<D, E, R> => InternalArrow.of(f)

/**
* Similiar to `Promise.all`, returns an Arrow where all operations will be run in parallel returning an array of R values. Optional a concurrency limit can be specified.
*/
export const all = <D, E, R>(f: Arrow<D, E, R>[], concurrencyLimit?: number): Arrow<D, E, R[]> => InternalArrow.all(f, concurrencyLimit)

/**
* Similiar to `Promise.race`, returns an Arrow where the R value from the first succesful operation will be returned.
*/
export const race = <D, E, R>(f: Arrow<D, E, R>[]): Arrow<D, E, R> => InternalArrow.race(f)

/**
* Resolve an Arrow with the specified value.
*/
export const resolve = <R, D = {}>(a: R): Arrow<D, never, R> => InternalArrow.resolve(a)

/**
* Similiar to `new Promise`, an optional 'tidy up' function can be returned to tidy up resources upon cancellation.
*/
export const construct = <D, E, R>(f: (_: D) => (resolve: (_: R) => void, reject: (_: E) => void) => void | (() => void)): Arrow<D, E, R> => InternalArrow.construct(f)

// TODO: make constructTask more efficient in runner

/**
* Similiar to `construct` but useful for when no dependencies are required from the returned Arrow.
*/
export const constructTask = <D, E, R>(f: (resolve: (_: R) => void, reject: (_: E) => void) => void | (() => void)): Arrow<D, E, R> => InternalArrow.construct(() => f)
