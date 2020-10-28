import { Either, Left, Right } from '../either/index'
import { Arrow } from './index'

export const draw = <D, D2, E, R>(f: (_:D) => Arrow<D2, E, R>): Arrow<D & D2, E, R> => Arrow<D, never, D>(async a => Right(a)).flatMap(f)

export const drawAsync = <R, D = {}>(a:(_:D) => Promise<R>): Arrow<D, never, R> => Arrow((s: D) => a(s).then(Right))

export const drawFailableAsync = <R, D = {}, E = Error>(a:(_:D) => Promise<R>): Arrow<D, E, R> => Arrow((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

export const drawFunction = <R, D = {}>(a:(_:D) => R): Arrow<D, never, R> => Arrow((s:D) => Promise.resolve(Right(a(s))))

export const drawFailableFunction = <R, D = {}, E = Error>(a:(_:D) => R): Arrow<D, E, R> => Arrow((s:D) => {
  try {
    const r = a(s)
    return Promise.resolve(Right(r))
  } catch (e) {
    return Promise.resolve(Left(e))
  }
})

export const succeed = <R, D = {}>(a: R): Arrow<D, never, R> => Arrow(async (_:D) => Right(a))

export const fail = <E, D = {}>(a: E): Arrow<D, E, never> => Arrow(async (_:D) => Left(a))

export const drawNullable = <R>(
  a: R | null | undefined
): Arrow<{}, null, R> => Arrow(async () => (a === undefined || a === null ? Left(null) : Right(a)))

export const drawEither = <E, R>(a:Either<E, R>):Arrow<{}, E, R> => Arrow(async (_:{}) => a)
