import { Either, Left, Right } from '../either/index'
import { Arrow } from './index'

/**
* Use a dependency returning an Arrow.
*/
export const draw = <D, D2, E, R>(f: (_:D) => Arrow<D2, E, R>): Arrow<D & D2, E, R> => Arrow<D, never, D>(async a => Right(a)).flatMap(f)

/**
 * Create an Arrow from an async function that wont fail.
 */
export const drawAsync = <R, D = {}>(a:(_:D) => Promise<R>): Arrow<D, never, R> => Arrow((s: D) => a(s).then(Right))

/**
 * Create an Arrow from an async function that may fail with error type E.
 */
export const drawFailableAsync = <R, D = {}, E = Error>(a:(_:D) => Promise<R>): Arrow<D, E, R> => Arrow((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

/**
 * Create an Arrow from a regular function that wont fail.
 */
export const drawFunction = <R, D = {}>(a:(_:D) => R): Arrow<D, never, R> => Arrow((s:D) => Promise.resolve(Right(a(s))))

/**
 * Create an Arrow from a regular function that may fail with error type E.
 */
export const drawFailableFunction = <R, D = {}, E = Error>(a:(_:D) => R): Arrow<D, E, R> => Arrow((s:D) => {
  try {
    const r = a(s)
    return Promise.resolve(Right(r))
  } catch (e) {
    return Promise.resolve(Left(e))
  }
})

/**
 * Create an Arrow from a value with the error type as the value type.
 */
export const reject = <E, D = {}>(a: E): Arrow<D, E, never> => Arrow(async (_:D) => Left(a))

/**
 * Create an Arrow from a nullable value from the Arrows dependencies with either the error type as null or the result type as the value type.
 */
export const drawNullable = <D, R>(
  f:(_:D) => R | null | undefined
): Arrow<D, null, R> => Arrow(async (d) => {
  const r = f(d)
  if (r === undefined || r === null) {
    return Left(null) 
  } else {
    return Right(r)
  }
})

/**
 * Create an Arrow from a nullable value with either the error type as null or the result type as the value type.
 */
export const fromNullable = <R>(
  a: R | null | undefined
): Arrow<{}, null, R> => Arrow(async () => (a === undefined || a === null ? Left(null) : Right(a)))


/**
 * Create an Arrow from an Either type drawn from a dependency.
 */
export const drawEither = <D, E, R>(f:(_:D) => Either<E, R>):Arrow<D, E, R> => Arrow(async (d:D) => f(d))

/**
 * Create an Arrow from an Either type.
 */
export const fromEither = <E, R>(a:Either<E, R>):Arrow<{}, E, R> => Arrow(async (_:{}) => a)

/**
 * Create a function returning an Arrow from an async function.
 */
export const convertAsync = <A, R, E = Error>(
  f: (_: A) => Promise<R>
): (__: A) => Arrow<{}, E, R> => (a: A) => Arrow(async () => f(a).then(Right).catch(Left))

/**
 * Create a function returning an Arrow from an async function.
 */
export const convertAsyncE = <E>() => <A, R>(
  f: (_: A) => Promise<R>
): (__: A) => Arrow<{}, E, R> => (a: A) => Arrow(async () => f(a).then(Right).catch(Left))


/**
 * Create a function returning an Arrow from an async function.
 */
export const convertAsyncNullable = <A, R>(
  f: (_: A) => Promise<R | null | undefined>
): (__: A) => Arrow<{}, null, R> => (a: A) => Arrow(async () => f(a).then(b => (b === undefined || b === null ? Left(null) : Right(b))))
