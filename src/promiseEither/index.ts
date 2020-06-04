
import { Either, Right, Left } from '../either'

export interface PromiseEither<E, A> {
  __val: Promise<Either<E, A>>
  __tag: string
  map: <B>(f:(_:A) => B) => PromiseEither<E, B>
  leftMap: <E2>(f:(_:E) => E2) => PromiseEither<E2, A>
  biMap: <E2, B>(f:(_:E) => E2, g:(_:A) => B) => PromiseEither<E2, B>
  flatMap: <E2, B>(f:(_:A) => PromiseEither<E2, B>) => PromiseEither<E | E2, B>
  flatMapF: <E2, B>(f:(_:A) => Promise<Either<E2, B>>) => PromiseEither<E | E2, B>
  combine: <E2, B>(pe: PromiseEither<E2, B>) => PromiseEither<E | E2, A | B>
  onComplete: <B, E2, ER>(
    onSuccess: (_:A) => B,
    onFailure: (_:E) => E2,
    onError: (_?: Error) => ER
  ) => Promise<B | E2 | ER>
}

export const PromiseEither = <E, A>(__val: Promise<Either<E, A>>): PromiseEither<E, A> => ({
  __val,
  __tag: 'PromiseEither',
  map: <B>(f: (_:A) => B) => PromiseEither<E, B>(__val.then(eitherA => eitherA.map(f))),
  leftMap: <E2>(f: (_:E) => E2) => PromiseEither<E2, A>(__val.then(eitherA => eitherA.leftMap(f))),
  biMap: <E2, B>(f:(_:E) => E2, g:(_:A) => B) => PromiseEither<E2, B>(__val.then(eitherA => eitherA.map(g).leftMap(f))),
  flatMap: <E2, B>(f: (_:A) => PromiseEither<E2, B>) => PromiseEither<E | E2, B>(
    __val.then(eitherA => eitherA.match(
      none => Promise.resolve<Either<E | E2, B>>(Left(none)),
      some => f(some).__val
    ))
  ),
  flatMapF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>) => PromiseEither<E | E2, B>(__val.then(eitherA => eitherA.match(
    none => Promise.resolve<Either<E | E2, B>>(Left(none)),
    some => f(some)
  ))),
  combine: <E2, B>(pe: PromiseEither<E2, B>) => PromiseEither<E2, A | B>(__val.then(
    (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
      none => pe.__val,
      some => Promise.resolve(Right(some))
    )
  )),
  onComplete: <B, E2, ER>(f: (_:A) => B, g: (_:E) => E2, j: (_?: any) => ER) => __val.then(
    (a) => a.match(
      none => g(none),
      some => f(some)
    )
  ).catch(
    j
  )
})

// constructors

export const fromEither = <E, A>(a: Either<E, A>) => PromiseEither(Promise.resolve(a))

export const peLeft = <E, A = never>(e: E) => PromiseEither(Promise.resolve(Left<E, A>(e)))
export const peRight = <A, E = never>(a: A) => PromiseEither(Promise.resolve(Right<A, E>(a)))

export const fromNullable = <A, B>(a: A | null | undefined) => {
  if (a === null || a === undefined) {
    return peLeft(null)
  }
  return peRight<A>(a)
}

// combinators

export const sequence = <E, A>(as: PromiseEither<E, A>[]): PromiseEither<E, A[]> => as.reduce(
  (acc, teA) => acc.flatMap((a) => teA.map(c => [...a, c])), PromiseEither<E, A[]>(Promise.resolve(Right<A[]>([])))
)

export const combine = <E, A>(...as: PromiseEither<E, A>[]): PromiseEither<E, A> => {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].combine(as[1])
  const [a, b, ...aas] = as
  return combine(a.combine(b), ...aas)
}

export const retry = (n: number) => <E, A>(a: PromiseEither<E, A>): PromiseEither<E, A> => (n < 1 ? a : a.combine(retry(n - 1)(a)))

// kliesli combinators

export type PromiseEitherK <A, B, C> = (a: (A)) => PromiseEither<B, C>

export function composeK <A, B, C, D, E>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>): (d: A) => PromiseEither<B | D, E>
export function composeK <A, B, C, D, E, F, G>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>): (d: A) => PromiseEither<B | D | F, G>
export function composeK <A, B, C, D, E, F, G, H, I>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>): (d: A) => PromiseEither<B | D | F | H, I>
export function composeK <A, B, C, D, E, F, G, H, I, J, K>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>): (d: A) => PromiseEither<B | D | F | H | J, K>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>)
  : (d: A) => PromiseEither<B | D | F | H | J | L, M>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N, O>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N | P, Q>
export function composeK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>, i: PromiseEitherK<Q, R, S>)
  : (d: A) => PromiseEither<B | D | F | H | J | L | N | P | R, S>
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

export const sequenceK = <C, E, A>(as: PromiseEitherK<C, E, A>[]): PromiseEitherK<C, E, A[]> => as.reduce(
  (acc, teaK) => (_: C) => teaK(_).flatMap(a => acc(_).map(aas => [a, ...aas])), (_: C) => PromiseEither<E, A[]>(Promise.resolve(Right<A[]>([])))
)

export function combineK <A, B, C, D, E>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<A, D, E>): (d: A) => PromiseEither<D, C | E>
export function combineK <A, B, C, D, E, F, G>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<A, D, E>, c: PromiseEitherK<A, F, G>): (d: A) => PromiseEither<F, C | E | G>
export function combineK <A, B, C, D, E, F, G, H, I>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<A, D, E>, c: PromiseEitherK<A, F, G>, d: PromiseEitherK<A, H, I>): (d: A) => PromiseEither<H, C | E | G | I>
export function combineK <A, B, C, D, E, F, G, H, I, J, K>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<A, D, E>, c: PromiseEitherK<A, F, G>, d: PromiseEitherK<A, H, I>, e: PromiseEitherK<A, J, K>): (d: A) => PromiseEither<J, C | E | G | I | K>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<A, D, E>, c: PromiseEitherK<A, F, G>, d: PromiseEitherK<A, H, I>, e: PromiseEitherK<A, J, K>, f: PromiseEitherK<A, L, M>)
    : (d: A) => PromiseEither<L, C | E | G | I | K | M>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>)
    : (d: A) => PromiseEither<N, C | E | G | I | K | M | O>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>)
    : (d: A) => PromiseEither<P, C | E | G | I | K | M | O | Q>
export function combineK <A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: PromiseEitherK<A, B, C>, b: PromiseEitherK<C, D, E>, c: PromiseEitherK<E, F, G>, d: PromiseEitherK<G, H, I>, e: PromiseEitherK<I, J, K>, f: PromiseEitherK<K, L, M>, g: PromiseEitherK<M, N, O>, h: PromiseEitherK<O, P, Q>, i: PromiseEitherK<Q, R, S>)
    : (d: A) => PromiseEither<R, C | E | G | I | K | M | O | Q | S>
export function combineK <A>(...a: PromiseEitherK<A, any, any>[]): PromiseEitherK<A, any, any>
export function combineK<A>(...as: PromiseEitherK<A, any, any>[]): PromiseEitherK<A, any, any> {
  if (as.length === 1) return as[0]
  if (as.length === 2) return (c: A) => as[0](c).combine(as[1](c))
  const [a, b, ...aas] = as
  return combineK(combineK(a, b), ...aas)
}

export const retryK = (n: number) => <C, E, A>(a: PromiseEitherK<C, E, A>): PromiseEitherK<C, E, A> => (n < 1 ? a : combineK(a, (retryK(n - 1)(a))))
