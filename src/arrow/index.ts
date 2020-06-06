import {
  Either, Left, Right, fromNullable as eitherFromNullable
} from '../either'

// interface

export interface Arrow<Ctx, E, A> {
  __val: (_:Ctx) => Promise<Either<E, A>>
  map: <B>(f: (_:A) => B) => Arrow<Ctx, E, B>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<Ctx, E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<Ctx, E2, B>
  flatMap: <E2, B>(f: (_:A) => Arrow<Ctx, E2, B>) => Arrow<Ctx, E | E2, B>
  flatMapF: <E2, B>(f: (_:A) => (_:Ctx) => Promise<Either<E2, B>>) => Arrow<Ctx, E | E2, B>
  andThen: <E2, B>(_: Arrow<A, E2, B>) => Arrow<Ctx, E | E2, B>
  andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>) => Arrow<Ctx, E | E2, B>
  combine: <E2, B>(f:Arrow<Ctx, E2, B>) => Arrow<Ctx, E2, A | B>
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
  flatMap: <E2, B>(f: (_:A) => Arrow<Ctx, E2, B>):Arrow<Ctx, E | E2, B> => Arrow<Ctx, E | E2, B>(
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
  combine: <E2, B>(f:Arrow<Ctx, E2, B>):Arrow<Ctx, E2, A | B> => Arrow<Ctx, E2, A | B>(
    (c: Ctx) => __val(c)
      .then(
        (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
          e => f.__val(c),
          a => Promise.resolve(Right(a))
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

// constructors

export const resolve = <Ctx, A, E = never>(a: A):Arrow<Ctx, E, A> => Arrow(async (_:Ctx) => Right(a))

export const reject = <Ctx, E, A = never>(a: E):Arrow<Ctx, E, A> => Arrow(async (_:Ctx) => Left(a))

export const ofContext = <A>():Arrow<A, never, A> => Arrow(async (a:A) => Right(a))

export const fromNullable = <A, B, C = any>(a: A | null | undefined): Arrow<C, null, A> => Arrow(async (_: C) => eitherFromNullable(a))

export const fromPromise = <A, E = never, C = any>(a: Promise<A>):Arrow<C, E, A> => Arrow(async (_:C) => a.then(Right).catch(Left))

export const fromEither = <E, A, C = any>(a:Either<E, A>):Arrow<C, E, A> => Arrow(async (_:C) => a)

export const fromPromiseEither = <E, A, C = any>(a:Promise<Either<E, A>>):Arrow<C, E, A> => Arrow((_:C) => a)

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


// kleisli combinators

export type ArrowK<Ctx, A, B, C> = (a: (A)) => Arrow<Ctx, B, C>

export function composeK <Ctx, A, B, C, D, E>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>): (d: A) => Arrow<Ctx, B | D, E>
export function composeK <Ctx, A, B, C, D, E, F, G>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>): (d: A) => Arrow<Ctx, B | D | F, G>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>): (d: A) => Arrow<Ctx, B | D | F | H, I>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I, J, K>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>): (d: A) => Arrow<Ctx, B | D | F | H | J, K>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>)
  : (d: A) => Arrow<Ctx, B | D | F | H | J | L, M>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>)
  : (d: A) => Arrow<Ctx, B | D | F | H | J | L | N, O>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>, h: ArrowK<Ctx, O, P, Q>)
  : (d: A) => Arrow<Ctx, B | D | F | H | J | L | N | P, Q>
export function composeK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>, h: ArrowK<Ctx, O, P, Q>, i: ArrowK<Ctx, Q, R, S>)
  : (d: A) => Arrow<Ctx, B | D | F | H | J | L | N | P | R, S>
export function composeK<A>(...as: any[]) {
  return function (d: A) {
    const [aa, ...aas] = as
    if (aas && aas.length === 0) return aa(d)
    return aa(d).flatMap(
      // @ts-ignore
      composeK(...aas)
    )
  }
}

export const sequenceK = <Ctx, C, E, A>(as: ArrowK<Ctx, C, E, A>[]): ArrowK<Ctx, C, E, A[]> => as.reduce(
  (acc, teaK) => (_: C) => teaK(_).flatMap(a => acc(_).map(aas => [a, ...aas])), (_: C) => Arrow<Ctx, E, A[]>(() => Promise.resolve(Right<A[]>([])))
)

export function combineK <Ctx, A, B, C, D, E>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, A, D, E>): (d: A) => Arrow<Ctx, D, C | E>
export function combineK <Ctx, A, B, C, D, E, F, G>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, A, D, E>, c: ArrowK<Ctx, A, F, G>): (d: A) => Arrow<Ctx,F, C | E | G>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, A, D, E>, c: ArrowK<Ctx, A, F, G>, d: ArrowK<Ctx, A, H, I>): (d: A) => Arrow<Ctx, H, C | E | G | I>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I, J, K>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, A, D, E>, c: ArrowK<Ctx, A, F, G>, d: ArrowK<Ctx, A, H, I>, e: ArrowK<Ctx, A, J, K>): (d: A) => Arrow<Ctx, J, C | E | G | I | K>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, A, D, E>, c: ArrowK<Ctx, A, F, G>, d: ArrowK<Ctx, A, H, I>, e: ArrowK<Ctx, A, J, K>, f: ArrowK<Ctx, A, L, M>)
    : (d: A) => Arrow<Ctx, L, C | E | G | I | K | M>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>)
    : (d: A) => Arrow<Ctx, N, C | E | G | I | K | M | O>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>, h: ArrowK<Ctx, O, P, Q>)
    : (d: A) => Arrow<Ctx, P, C | E | G | I | K | M | O | Q>
export function combineK <Ctx, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: ArrowK<Ctx, A, B, C>, b: ArrowK<Ctx, C, D, E>, c: ArrowK<Ctx, E, F, G>, d: ArrowK<Ctx, G, H, I>, e: ArrowK<Ctx, I, J, K>, f: ArrowK<Ctx, K, L, M>, g: ArrowK<Ctx, M, N, O>, h: ArrowK<Ctx, O, P, Q>, i: ArrowK<Ctx, Q, R, S>)
    : (d: A) => Arrow<Ctx, R, C | E | G | I | K | M | O | Q | S>
export function combineK <Ctx, A>(...a: ArrowK<Ctx, A, any, any>[]): ArrowK<Ctx, A, any, any>
export function combineK<Ctx, A>(...as: ArrowK<Ctx, A, any, any>[]): ArrowK<Ctx, A, any, any> {
  if (as.length === 1) return as[0]
  if (as.length === 2) return (c: A) => as[0](c).combine(as[1](c))
  const [a, b, ...aas] = as
  return combineK(combineK(a, b), ...aas)
}

export const retryK = (n: number) => <Ctx, C, E, A>(a: ArrowK<Ctx, C, E, A>): ArrowK<Ctx, C, E, A> => (n < 1 ? a : combineK(a, (retryK(n - 1)(a))))
