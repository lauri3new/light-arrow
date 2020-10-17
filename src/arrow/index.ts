import {
  Either, Left, Right
} from '../either/index'

// interface

export interface Arrow<D, E, A> {
  // constructor
  __val: (_:D) => Promise<Either<E, A>>
  // monad
  map: <B>(f: (_:A) => B) => Arrow<D, E, B>
  flatMap: <D2, E2, B>(f: (_:A) => Arrow<D2, E2, B>) => Arrow<D & D2, E | E2, B>
  leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, A>
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<D, E2, B>
  // combinators
  orElse: <D2, E2, B>(f:Arrow<D2, E2, B>) => Arrow<D & D2, E2, A | B>
  andThen: <E2, B>(f: Arrow<Partial<A>, E2, B>) => Arrow<D, E | E2, B>
  group: <D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) => Arrow<D & D2, E | E2, [A, B]>
  groupFirst: <D2, E2, B>(f:Arrow<Partial<D>& D2, E2, B>) => Arrow<D & D2, E | E2, A>
  groupSecond: <D2, E2, B>(f:Arrow<Partial<D>& D2, E2, B>) => Arrow<D & D2, E | E2, B>
  // depencendies
  provide: <D2>(_:D) => Arrow<{}, E, A>
  // run
  runAsPromise: (
    context: D
  ) => Promise<{
    context: D,
    result: A
  }>
  runAsPromiseResult: (
    context: D
  ) => Promise<A>
  run: <B1, E2, F, D2>(
    context: D,
    mapResult: (_:A) => B1,
    mapError: (_:E) => E2,
    handleFailure: (_?: Error) => F,
    handleContext?: (_:D) => D2
  ) => void
  // flatMapF
  flatMapF: <D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>
  // combinatorsF
  orElseF: <D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E2, A | B>
  andThenF: <E2, B>(_:(_:Partial<A>) => Promise<Either<E2, B>>) => Arrow<D, E | E2, B>
  groupF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, [A, B]>
  groupFirstF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, A>
  groupSecondF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>
}

// implementation

export const Arrow = <D, E, A>(__val: (_:D) => Promise<Either<E, A>>):Arrow<D, E, A> => ({
  __val,
  map: <B>(f: (_:A) => B):Arrow<D, E, B> => Arrow<D, E, B>((_:D) => __val(_).then(a => a.map(f))),
  leftMap: <E2>(f: (_:E) => E2):Arrow<D, E2, A> => Arrow<D, E2, A>((_:D) => __val(_).then(a => a.leftMap(f))),
  biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<D, E2, B>((_:D) => __val(_).then(a => a.biMap(f, g))),
  flatMap: <D2, E2, B>(f: (_:A) => Arrow<D2, E2, B>):Arrow<D & D2, E | E2, B> => Arrow<D & D2, E | E2, B>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2).__val(a)
    ))
  ),
  provide: (ds: D) => Arrow((d) => __val(ds)),
  orElse: <D2, E2, B>(f:Arrow<D2, E2, B>) => Arrow<D & D2, E2, A | B>(
    (c: D & D2) => __val(c)
      .then(
        (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
          e => f.__val(c),
          a => Promise.resolve(Right(a))
        )
      )
  ),
  andThen: <E2, B>(f: Arrow<Partial<A>, E2, B>):Arrow<D, E | E2, B> => Arrow<D, E | E2, B>(
    (a: D) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(s2)
    ))
  ),
  group: <D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) => Arrow<D & D2, E | E2, [A, B]>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, [A, B]>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(a).then((c) => c.map((b) => [s2, b]))
    ))
  ),
  groupFirst: <D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) => Arrow<D & D2, E | E2, A>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, A>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(a).then(() => Right(s2))
    ))
  ),
  groupSecond: <D2, E2, B>(f:Arrow<Partial<D> & D2, E2, B>) => Arrow<D & D2, E | E2, B>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f.__val(a)
    ))
  ),
  runAsPromiseResult: (
    context: D
  ) => __val(context).then(
    (eitherD) => eitherD.match(
      error => { throw error },
      some => some
    )
  ),
  runAsPromise: (
    context: D
  ) => __val(context).then(
    (eitherD) => eitherD.match(
      error => { throw error },
      result => ({
        result,
        context
      })
    )
  ),
  run: <B1, E2, F, D2>(
    context: D,
    mapResult: (_:A) => B1,
    mapError: (_:E) => E2,
    handleFailure: (_?: Error) => F,
    handleContext?: (_:D) => D2
  ) => {
    __val(context).then(
      (eitherD) => {
          eitherD.match(
            none => mapError(none),
            some => mapResult(some)
          )
          if (handleContext) {
            handleContext(context)
          }
        }
    )
      .catch(
        handleFailure
      )
  },
  flatMapF: <D2, E2, B>(f: (_:A) => (_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)(a)
    ))
  ),
  orElseF: <D2, E2, B>(f:(_:D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E2, A | B>(
    (c: D & D2) => __val(c)
      .then(
        (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
          e => f(c),
          a => Promise.resolve(Right(a))
        )
      )
  ),
  andThenF: <E2, B>(f:(_:Partial<A>) => Promise<Either<E2, B>>):Arrow<D, E | E2, B> => Arrow<D, E | E2, B>(
    (a: D) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(s2)
    ))
  ),
  groupF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, [A, B]>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, [A, B]>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(a).then((c) => c.map((b) => [s2, b]))
    ))
  ),
  groupFirstF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, A>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, A>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(a).then(() => Right(s2))
    ))
  ),
  groupSecondF: <D2, E2, B>(f:(_:Partial<D> & D2) => Promise<Either<E2, B>>) => Arrow<D & D2, E | E2, B>(
    (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
      e => Promise.resolve(Left(e)),
      s2 => f(a)
    ))
  ),
})

// type aliases and constructors

export type TaskEither<E, A> = Arrow<{}, E, A>
export type Task<A> = Arrow<{}, never, A>

// constructors

export type Draw<D, A, B, C> = (a: (A)) => Arrow<D, B, C>

export const draw = <D, D2, E, A>(f:(_:D) => Arrow<D2, E, A>): Arrow<D & D2, E, A> => Arrow<D & D2, E, A>(
  (a: D & D2) => f(a).__val(a)
)

export const drawAsync = <D, A>(a:(_:D) => Promise<A>):Arrow<D, never, A> => Arrow((s: D) => a(s).then(Right))

export const drawFailableAsync = <D, A, E = Error>(a:(_:D) => Promise<A>):Arrow<D, E, A> => Arrow((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

export const drawFunction = <D, A>(a:(_:D) => A):Arrow<D, never, A> => Arrow((s:D) => Promise.resolve(Right(a(s))))

export const drawFailableFunction = <D, A, E = Error>(a:(_:D) => A):Arrow<D, E, A> => Arrow((s:D) => {
  try {
    const r = a(s)
    return Promise.resolve(Right(r))
  } catch (e) {
    return Promise.resolve(Left(e))
  }
})

export const succeed = <A, D extends {} = {}>(a: A) => Arrow(async (_:D) => Right(a))

export const fail = <E, D extends {} = {}>(a: E):Arrow<D, E, never> => Arrow(async (_:D) => Left(a))

export const drawNullable = <A>(
  a: A | null | undefined
): TaskEither<null, A> => Arrow(async () => (a === undefined || a === null ? Left(null) : Right(a)))

export const drawEither = <E, A>(a:Either<E, A>):TaskEither<E, A> => Arrow(async (_:{}) => a)

// D

export const provideSome = <D>(d: D) => <D2, E, A>(a: Arrow<D & D2, E, A>): Arrow<D2, E, A> => Arrow<D2, E, A>(
  (ds: D2) => a.__val({ ...ds, ...d })
)

// combinators

export function orElse <D1, E1, A1, D2, E2, A2>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>): Arrow<D1 & D2, E2, A1 | A2>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>): Arrow<D1 & D2 & D3, E3, A1 | A2 | A3>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>): Arrow<D1 & D2 & D3 & D4, E4, A1 | A2 | A3 | A4>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>): Arrow<D1 & D2 & D3 & D4 & D5, E5, A1 | A2 | A3 | A4 | A5>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6, E6, A1 | A2 | A3 | A4 | A5 | A6>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7, E7, A1 | A2 | A3 | A4 | A5 | A6 | A7>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>, h: Arrow<D8, E8, A8>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8, E8, A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8>
export function orElse <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8, D9, E9, A9>(a: Arrow<D1, E1, A1>, b: Arrow<D2, E2, A2>, c: Arrow<D3, E3, A3>, d: Arrow<D4, E4, A4>, e: Arrow<D5, E5, A5>, f: Arrow<D6, E6, A6>, g: Arrow<D7, E7, A7>, h: Arrow<D8, E8, A8>, i: Arrow<D9, E9, A9>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 & D9, E9, A1 | A2 | A3 | A4 | A5 | A6 | A7 | A8 | A9>
export function orElse(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].orElse(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return orElse(a.orElse(b), ...aas)
}

export function andThen <D1, E1, A1, E2, A2>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>): Arrow<D1, E1 | E2, A2>
export function andThen <D1, E1, A1, E2, A2, E3, A3>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>): Arrow<D1, E1 | E2 | E3, A3>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>): Arrow<D1, E1 | E2 | E3 | E4, A4>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, A5>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, A6>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, A7>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>, h: Arrow<A7, E8, A8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, A8>
export function andThen <D1, E1, A1, D2, E2, A2, D3, E3, A3, D4, E4, A4, D5, E5, A5, D6, E6, A6, D7, E7, A7, D8, E8, A8, D9, E9, A9>(a: Arrow<D1, E1, A1>, b: Arrow<A1, E2, A2>, c: Arrow<A2, E3, A3>, d: Arrow<A3, E4, A4>, e: Arrow<A4, E5, A5>, f: Arrow<A5, E6, A6>, g: Arrow<A6, E7, A7>, h: Arrow<A7, E8, A8>, i: Arrow<A8, E9, A9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, A9>
export function andThen(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].andThen(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return andThen(a.andThen(b), ...aas)
}

export const sequence = <D, B, C>(as: Arrow<D, B, C>[]): Arrow<D, B, C[]> => as.reduce(
  (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c])), Arrow<D, B, C[]>(async (_: D) => Right<C[]>([]))
)

export const retry = (n: number) => <D, B, C>(a: Arrow<D, B, C>): Arrow<D, B, C> => (n < 1 ? a : a.orElse(retry(n - 1)(a)))

// utility types

export type ArrowsRight<ARROW> = ARROW extends Arrow<any, any, infer A> ? A : never
export type ArrowsLeft<ARROW> = ARROW extends Arrow<any, infer E, any> ? E : never
export type ArrowsD<ARROW> = ARROW extends Arrow<infer D, any, any> ? D : never

const a = succeed<{ abc: number }, { ok: 123 }>({ abc: 123 })
  .provide({ ok: 123 })
  .run(
    {},
    x => x,
    b => b,
    c => c
  )
