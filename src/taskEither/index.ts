import {
  Either, Left, Right, fromNullable as eitherFromNullable
} from '../either'

// interface

export interface TaskEither<E, A> {
  __val: () => Promise<Either<E, A>>
  map: <B>(f: (_:A) => B) => TaskEither<E, B>
  leftMap: <E2>(f: (_:E) => E2) => TaskEither<E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => TaskEither<E2, B>
  flatMap: <E2, B>(f: (_:A) => TaskEither<E2, B>) => TaskEither<E | E2, B>
  flatMapF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>) => TaskEither<E | E2, B>
  andThen: <E2, B>(_: TaskEither<E2, B>) => TaskEither<E | E2, B>
  andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>) => TaskEither<E | E2, B>
  combine: <E2, B>(f:TaskEither<E2, B>) => TaskEither<E2, A | B>
  runP: () => Promise<A>
  run: <B, E2, ER>(
    f: (_:A) => B,
    g: (_:E) => E2,
    j: (_?: Error) => ER
  ) => Promise<B | E2 | ER>
}

// implementation

export const TaskEither = <E, A>(__val: () => Promise<Either<E, A>>):TaskEither<E, A> => ({
  __val,
  map: <B>(f: (_:A) => B):TaskEither<E, B> => TaskEither<E, B>(() => __val().then(a => a.map(f))),
  leftMap: <E2>(f: (_:E) => E2):TaskEither<E2, A> => TaskEither<E2, A>(() => __val().then(a => a.leftMap(f))),
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => TaskEither<E2, B>(() => __val().then(a => a.biMap(f, g))),
  flatMap: <E2, B>(f: (_:A) => TaskEither<E2, B>):TaskEither<E | E2, B> => TaskEither<E | E2, B>(
    () => __val().then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2).__val()
    ))
  ),
  flatMapF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>):TaskEither<E | E2, B> => TaskEither<E | E2, B>(
    () => __val().then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  andThen: <E2, B>(f: TaskEither<E2, B>):TaskEither<E | E2, B> => TaskEither<E | E2, B>(
    () => __val().then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val()
    ))
  ),
  andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>):TaskEither<E | E2, B> => TaskEither<E | E2, B>(
    () => __val().then((eitherCtx2): Promise<Either<E | E2, B>> => eitherCtx2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  combine: <E2, B>(f:TaskEither<E2, B>):TaskEither<E2, A | B> => TaskEither<E2, A | B>(
    () => __val()
      .then(
        (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
          e => f.__val(),
          a => Promise.resolve(Right(a))
        )
      )
  ),
  runP: () => __val().then(
    (eitherCtx) => eitherCtx.match(
      none => { throw none },
      some => some
    )
  ),
  run: <B, E2, ER>(
    f: (_:A) => B,
    g: (_:E) => E2,
    j: (_?: Error) => ER
  ) => __val().then(
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

export const resolve = <A, E = never>(a: A):TaskEither<E, A> => TaskEither(async () => Right(a))

export const reject = <E, A = never>(a: E):TaskEither<E, A> => TaskEither(async () => Left(a))

export const fromNullable = <A>(a: A | null | undefined): TaskEither<null, A> => TaskEither(async () => eitherFromNullable(a))

export const fromPromise = <A, E = Error>(a: Promise<A>):TaskEither<E, A> => TaskEither(() => a.then(Right).catch(Left))

export const kFromAsync = <I, A, E = Error>(a: (_:I) => Promise<A>):TaskEitherK<I, E, A> => (_: I) => TaskEither(() => a(_).then(Right).catch(Left))

export const fromEither = <E, A>(a:Either<E, A>):TaskEither<E, A> => TaskEither(async () => a)

export const fromPromiseEither = <E, A>(a:Promise<Either<E, A>>):TaskEither<E, A> => TaskEither(() => a)

// combinators

export const sequence = <E, A>(as: TaskEither<E, A>[]): TaskEither<E, A[]> => as.reduce(
  (acc, teA) => acc.flatMap((a) => teA.map(c => [...a, c])), TaskEither<E, A[]>(async () => Right<A[]>([]))
)

export const combine = <E, A>(...as: TaskEither<E, A>[]): TaskEither<E, A> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combine(as[1])
  const [a, b, ...aas] = as
  return combine(a.combine(b), ...aas)
}

export const retry = (n: number) => <E, A>(a: TaskEither<E, A>): TaskEither<E, A> => (n < 1 ? a : a.combine(retry(n - 1)(a)))

// kleisli combinators

export type TaskEitherK <A, B, C> = (a: (A)) => TaskEither<B, C>

export function composeK <A, B, C, D, E>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>): (d: A) => TaskEither<B | D, E>
export function composeK <A, B, C, D, E, F, G>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>): (d: A) => TaskEither<B | D | F, G>
export function composeK <A, B, C, D, E, F, G, H, I>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>): (d: A) => TaskEither<B | D | F | H, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>): (d: A) => TaskEither<B | D | F | H | J, K>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>)
  : (d: A) => TaskEither<B | D | F | H | J | L, M>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>)
  : (d: A) => TaskEither<B | D | F | H | J | L | N, O>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>, h: TaskEitherK<O, P, Q>)
  : (d: A) => TaskEither<B | D | F | H | J | L | N | P, Q>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>, h: TaskEitherK<O, P, Q>, i: TaskEitherK<Q, R, S>)
  : (d: A) => TaskEither<B | D | F | H | J | L | N | P | R, S>
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

export const sequenceK = <C, E, A>(as: TaskEitherK<C, E, A>[]): TaskEitherK<C, E, A[]> => as.reduce(
  (acc, teaK) => (_: C) => teaK(_).flatMap(a => acc(_).map(aas => [a, ...aas])), (_: C) => TaskEither<E, A[]>(() => Promise.resolve(Right<A[]>([])))
)

export function combineK <A, B, C, D, E>(a: TaskEitherK<A, B, C>, b: TaskEitherK<A, D, E>): (d: A) => TaskEither<D, C | E>
export function combineK <A, B, C, D, E, F, G>(a: TaskEitherK<A, B, C>, b: TaskEitherK<A, D, E>, c: TaskEitherK<A, F, G>): (d: A) => TaskEither<F, C | E | G>
export function combineK <A, B, C, D, E, F, G, H, I>(a: TaskEitherK<A, B, C>, b: TaskEitherK<A, D, E>, c: TaskEitherK<A, F, G>, d: TaskEitherK<A, H, I>): (d: A) => TaskEither<H, C | E | G | I>
export function combineK <A, B, C, D, E, F, G, H, I, J, K>(a: TaskEitherK<A, B, C>, b: TaskEitherK<A, D, E>, c: TaskEitherK<A, F, G>, d: TaskEitherK<A, H, I>, e: TaskEitherK<A, J, K>): (d: A) => TaskEither<J, C | E | G | I | K>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: TaskEitherK<A, B, C>, b: TaskEitherK<A, D, E>, c: TaskEitherK<A, F, G>, d: TaskEitherK<A, H, I>, e: TaskEitherK<A, J, K>, f: TaskEitherK<A, L, M>)
    : (d: A) => TaskEither<L, C | E | G | I | K | M>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>)
    : (d: A) => TaskEither<N, C | E | G | I | K | M | O>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>, h: TaskEitherK<O, P, Q>)
    : (d: A) => TaskEither<P, C | E | G | I | K | M | O | Q>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: TaskEitherK<A, B, C>, b: TaskEitherK<C, D, E>, c: TaskEitherK<E, F, G>, d: TaskEitherK<G, H, I>, e: TaskEitherK<I, J, K>, f: TaskEitherK<K, L, M>, g: TaskEitherK<M, N, O>, h: TaskEitherK<O, P, Q>, i: TaskEitherK<Q, R, S>)
    : (d: A) => TaskEither<R, C | E | G | I | K | M | O | Q | S>
export function combineK <A>(...a: TaskEitherK<A, any, any>[]): TaskEitherK<A, any, any>
export function combineK<A>(...as: TaskEitherK<A, any, any>[]): TaskEitherK<A, any, any> {
  if (as.length === 1) return as[0]
  if (as.length === 2) return (c: A) => as[0](c).combine(as[1](c))
  const [a, b, ...aas] = as
  return combineK(combineK(a, b), ...aas)
}

export const retryK = (n: number) => <C, E, A>(a: TaskEitherK<C, E, A>): TaskEitherK<C, E, A> => (n < 1 ? a : combineK(a, (retryK(n - 1)(a))))
