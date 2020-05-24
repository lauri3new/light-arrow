import { Either, Left, Right } from './either'

// interface

export interface Arrow<S, E, Sout> {
  __val: (_:S) => Promise<Either<E, Sout>>
  map: <S2out>(f: (_:Sout) => S2out) => Arrow<S, E, S2out>
  combineA: (f:Arrow<S, E, Sout>) => Arrow<S, E, Sout>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<S, E2, Sout>
  flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<S, E | E2, S2Out>) => Arrow<S, E | E2, S2Out>
  andThen: <E2, S2Out>(_: Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, S2Out>
  andThenMerge: <E2, S2Out>(_: Arrow<Sout, E2, S2Out>) => Arrow<S, E | E2, Sout & S2Out>
  andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>) => Arrow<S, E | E2, S2Out>
  runP: (
    context: S
  ) => Promise<Sout>
  run: <A, B, C>(
    context: S,
    f: (_:Sout) => A,
    g: (_:E) => B,
    j: (_?: Error) => C
  ) => Promise<A | B | C>
}

// implementation

export const Arrow = <S, E, Sout>(__val: (_:S) => Promise<Either<E, Sout>>):Arrow<S, E, Sout> => ({
  __val,
  map: <S2out>(f: (_:Sout) => S2out):Arrow<S, E, S2out> => Arrow<S, E, S2out>((_:S) => __val(_).then(a => a.map(f))),
  combineA: (f:Arrow<S, E, Sout>):Arrow<S, E, Sout> => Arrow<S, E, Sout>(
    (c: S) => __val(c)
      .then(
        (eitherA) => eitherA.match(
          e => f.__val(c),
          a => Right(a)
        )
      )
  ),
  leftMap: <E2>(f: (_:E) => E2):Arrow<S, E2, Sout> => Arrow<S, E2, Sout>((_:S) => __val(_).then(a => a.leftMap(f))),
  flatMap: <E2, S2Out>(f: (_:Sout) => Arrow<S, E | E2, S2Out>):Arrow<S, E | E2, S2Out> => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2).__val(a)
    ))
  ),
  andThen: <E2, S2Out>(f: Arrow<Sout, E2, S2Out>):Arrow<S, E | E2, S2Out> => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2)
    ))
  ),
  andThenF: <E2, S2Out>(f: (_:Sout) => Promise<Either<E, S2Out>>):Arrow<S, E | E2, S2Out> => Arrow<S, E | E2, S2Out>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, S2Out>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  andThenMerge: <E2, A>(f: Arrow<Sout, E2, A>):Arrow<S, E | E2, Sout & A> => Arrow<S, E | E2, Sout & A>(
    (a: S) => __val(a).then((eitherS2): Promise<Either<E | E2, Sout & A>> => eitherS2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2).then(eitherS => eitherS.map(a2 => ({ ...s2, ...a2 })))
    ))
  ),
  runP: (
    context: S
  ) => __val(context).then(
    (eitherS) => eitherS.match(
      none => { throw none },
      some => some
    )
  ),
  run: <A, B, C>(
    context: S,
    f: (_:Sout) => A,
    g: (_:E) => B,
    j: (_?: Error) => C
  ) => __val(context).then(
    (eitherS) => eitherS.match(
      none => g(none),
      some => f(some)
    )
  )
    .catch(
      j
    )
})

export default Arrow

// constructors

export const resolve = <A>(a: A):Arrow<any, never, A> => Arrow(async (_:any) => Right(a))

export const reject = <A>(a: A):Arrow<any, A, never> => Arrow(async (_:any) => Left(a))

export const ofContext = <A>():Arrow<A, never, A> => Arrow(async (a:A) => Right(a))

export const fromPromise = <A>(a: Promise<A>):Arrow<any, never, A> => Arrow(async (_:any) => a.then(Right))

export const fromFailablePromise = <A, E, C = any>(a: Promise<A>):Arrow<C, E, A> => Arrow(async (_:C) => a.then(Right).catch(Left))

export const fromEither = <E, A>(a:Either<E, A>) => Arrow(async (_:any) => a)

export const fromPEither = <E, A>(a:Promise<Either<E, A>>) => Arrow((_:any) => a)

export const fromKP = <S, A>(a:(_:S) => Promise<A>):Arrow<S, never, A> => Arrow((s: S) => a(s).then(Right))

export const fromFailableKP = <S, E, A>(a:(_:S) => Promise<A>):Arrow<S, E, A> => Arrow((s:S) => a(s).then(Right).catch((e) => Left<E>(e)))

// combinators

export const sequence = <A, B, C>(as: Arrow<A, B, C>[]): Arrow<A, B, C[]> => as.reduce(
  (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c])), Arrow<A, B, C[]>(async (ctx: A) => Right<C[]>([]))
)

export const combine = <A, B, C>(...as: Arrow<A, B, C>[]): Arrow<A, B, C> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combineA(as[1])
  const [a, b, ...aas] = as
  return combine(a.combineA(b), ...aas)
}

export const retry = (n: number) => <A, B, C>(a: Arrow<A, B, C>): Arrow<A, B, C> => (n < 1 ? a : a.combineA(retry(n - 1)(a)))
