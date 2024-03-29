// interface

export interface Either<E, A> {
  _tag: string
  __val: E | A
  leftMap:<B>(f:(_: E) => B) => Either<B, A>
  map:<B>(f:(_: A) => B) => Either<E, B>
  biMap:<E2, B>(f:(_: E) => E2, g:(_: A) => B) => Either<E2, B>
  flatMap:<EE, B>(f:(_: A) => Either<E | EE, B>) => Either<E | EE, B>
  match:<B, C>(f:(_:E) => B, g:(_:A) => C) => B | C
}

// type aliases

export type Right<A> = Either<never, A>
export type Left<E> = Either<E, never>

// implementations

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Right = <A, E = never>(a: A): Either<E, A> => ({
  _tag: 'right',
  __val: a,
  map: f => Right(f(a)),
  leftMap: f => Right(a),
  biMap: (f, g) => Right(g(a)),
  flatMap: f => f(a),
  match: (f, g) => g(a)
})

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Left = <E, A = never>(a: E): Either<E, A> => ({
  _tag: 'left',
  __val: a,
  map: _ => Left<E>(a),
  leftMap: f => Left(f(a)),
  biMap: (f, g) => Left(f(a)),
  flatMap: _ => Left<E>(a),
  match: (f, g) => f(a)
})

const fromNullable = <R>(
  a: R | null | undefined
): Either<null, R> => (a === undefined || a === null ? Left(null) : Right(a))

export const either = {
  Right,
  Left,
  fromNullable
}
