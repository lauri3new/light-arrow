import { Either, Left, Right } from './either'

// interface

export interface Arrow<Ctx, E, A> {
  __val: (_:Ctx) => Promise<Either<E, A>>
  map: <B>(f: (_:A) => B) => Arrow<Ctx, E, B>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<Ctx, E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<Ctx, E2, B>
  flatMap: <E2, B>(f: (_:A) => Arrow<Ctx, E | E2, B>) => Arrow<Ctx, E | E2, B>
  flatMapF: <E2, B>(f: (_:A) => (_:Ctx) => Promise<Either<E2, B>>) => Arrow<Ctx, E | E2, B>
  andThen: <E2, B>(_: Arrow<A, E2, B>) => Arrow<Ctx, E | E2, B>
  andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>) => Arrow<Ctx, E | E2, B>
  andThenMerge: <E2, B>(_: Arrow<A, E2, B>) => Arrow<Ctx, E | E2, A & B>
  combine: (f:Arrow<Ctx, E, A>) => Arrow<Ctx, E, A>
  runP: (
    context: Ctx
  ) => Promise<A>
  run: <B, E2, ER>(
    context: Ctx,
    f: (_:A) => B,
    g: (_:E) => E2,
    j: (_?: Error) => ER
  ) => Promise<B | E2 | ER>
}

// implementation

export const Arrow = <Ctx, E, A>(__val: (_:Ctx) => Promise<Either<E, A>>):Arrow<Ctx, E, A> => ({
  __val,
  map: <B>(f: (_:A) => B):Arrow<Ctx, E, B> => Arrow<Ctx, E, B>((_:Ctx) => __val(_).then(a => a.map(f))),
  leftMap: <E2>(f: (_:E) => E2):Arrow<Ctx, E2, A> => Arrow<Ctx, E2, A>((_:Ctx) => __val(_).then(a => a.leftMap(f))),
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<Ctx, E2, B>((_:Ctx) => __val(_).then(a => a.biMap(f, g))),
  flatMap: <E2, B>(f: (_:A) => Arrow<Ctx, E | E2, B>):Arrow<Ctx, E | E2, B> => Arrow<Ctx, E | E2, B>(
    (a: Ctx) => __val(a).then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2).__val(a)
    ))
  ),
  flatMapF: <E2, B>(f: (_:A) => (_:Ctx) => Promise<Either<E2, B>>):Arrow<Ctx, E | E2, B> => Arrow<Ctx, E | E2, B>(
    (a: Ctx) => __val(a).then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)(a)
    ))
  ),
  andThen: <E2, B>(f: Arrow<A, E2, B>):Arrow<Ctx, E | E2, B> => Arrow<Ctx, E | E2, B>(
    (a: Ctx) => __val(a).then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2)
    ))
  ),
  andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>):Arrow<Ctx, E | E2, B> => Arrow<Ctx, E | E2, B>(
    (a: Ctx) => __val(a).then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  andThenMerge: <E2, B>(f: Arrow<A, E2, B>):Arrow<Ctx, E | E2, A & B> => Arrow<Ctx, E | E2, A & B>(
    (a: Ctx) => __val(a).then((eitherCtx2): Promise<Either<E | E2, A & B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2).then(eitherCtx => eitherCtx.map(a2 => ({ ...s2, ...a2 })))
    ))
  ),
  combine: (f:Arrow<Ctx, E, A>):Arrow<Ctx, E, A> => Arrow<Ctx, E, A>(
    (c: Ctx) => __val(c)
      .then(
        (eitherA) => eitherA.match(
          e => f.__val(c),
          a => Right(a)
        )
      )
  ),
  runP: (
    context: Ctx
  ) => __val(context).then(
    (eitherCtx) => eitherCtx.match(
      none => { throw none },
      some => some
    )
  ),
  run: <B, E2, ER>(
    context: Ctx,
    f: (_:A) => B,
    g: (_:E) => E2,
    j: (_?: Error) => ER
  ) => __val(context).then(
    (eitherCtx) => eitherCtx.match(
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

export const resolve = <A, B = any>(a: A):Arrow<B, never, A> => Arrow(async (_:any) => Right(a))

export const reject = <A, B = any>(a: A):Arrow<B, A, never> => Arrow(async (_:any) => Left(a))

export const ofContext = <A>():Arrow<A, never, A> => Arrow(async (a:A) => Right(a))

export const fromPromise = <A>(a: Promise<A>):Arrow<any, never, A> => Arrow(async (_:any) => a.then(Right))

export const fromFailablePromise = <A, E, C = any>(a: Promise<A>):Arrow<C, E, A> => Arrow(async (_:C) => a.then(Right).catch(Left))

export const fromEither = <E, A, C = any>(a:Either<E, A>):Arrow<C, E, A> => Arrow(async (_:any) => a)

export const fromPEither = <E, A, C = any>(a:Promise<Either<E, A>>):Arrow<C, E, A> => Arrow((_:any) => a)

export const fromKP = <Ctx, A>(a:(_:Ctx) => Promise<A>):Arrow<Ctx, never, A> => Arrow((s: Ctx) => a(s).then(Right))

export const fromFailableKP = <Ctx, E, A>(a:(_:Ctx) => Promise<A>):Arrow<Ctx, E, A> => Arrow((s:Ctx) => a(s).then(Right).catch((e) => Left<E>(e)))

// combinators

export const sequence = <A, B, C>(as: Arrow<A, B, C>[]): Arrow<A, B, C[]> => as.reduce(
  (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c])), Arrow<A, B, C[]>(async (ctx: A) => Right<C[]>([]))
)

export const combine = <A, B, C>(...as: Arrow<A, B, C>[]): Arrow<A, B, C> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combine(as[1])
  const [a, b, ...aas] = as
  return combine(a.combine(b), ...aas)
}

export const retry = (n: number) => <A, B, C>(a: Arrow<A, B, C>): Arrow<A, B, C> => (n < 1 ? a : a.combine(retry(n - 1)(a)))
