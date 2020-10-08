// import {
//   Either, Left, Right
// } from '../either/index'

// interface

export interface __ArrowO {}

// all extend object

// export interface Arrow<D extends object, E, A extends object, R extends object = D> {
//   __val: (_:D) => Promise<Either<E, A>>
//   map: <B extends object>(f: (_:A) => B) => Arrow<D, E, B, R>
//   leftMap: <E2>(f: (_:E) => E2) => Arrow<D, E2, A, R>
//   biMap: <E2, B extends object>(f: (_:E) => E2, g: (_:A) => B) => Arrow<D, E2, B, R>
//   flatMap: <D2 extends object, E2, B extends object>(f: (_:A) => Arrow<D2, E2, B>) => Arrow<D & D2, E | E2, B, R & D2>
//   // provideSome: <S extends Partial<R>>(_:S) => Arrow<D, E, A, Omit<D, keyof S>>
//   // provideAll: (_:R) => Arrow<D, E, A, {}>
//   flatMapF: <E2, B extends object>(f: (_:A) => (_:D) => Promise<Either<E2, B>>) => Arrow<D, E | E2, B, R>
//   andThen: <D2 extends object, E2, B extends object>(_: Arrow<D2, E2, B>) => Arrow<D, E | E2, B, R>
//   andThenF: <E2, B extends object>(f: (_:A) => Promise<Either<E2, B>>) => Arrow<D, E | E2, B, R>
//   combine: <E2, B extends object>(f:Arrow<D, E2, B>) => Arrow<D, E2, A | B, R>
//   runP: (
//     context: R
//   ) => Promise<A>
//   run: <B, E2, ER>(
//     context: R,
//     f: (_:A) => B,
//     g: (_:E) => E2,
//     j: (_?: Error) => ER
//   ) => Promise<B | E2 | ER>
// }

// // implementation

// export const Arrow = <D extends object, E, A, R extends object = D>(__val: (_:D) => Promise<Either<E, A>>):Arrow<D, E, A, R> => ({
//   __val,
//   map: <B>(f: (_:A) => B):Arrow<D, E, B, R> => Arrow<D, E, B, R>((_:D) => __val(_).then(a => a.map(f))),
//   leftMap: <E2>(f: (_:E) => E2):Arrow<D, E2, A, R> => Arrow<D, E2, A, R>((_:D) => __val(_).then(a => a.leftMap(f))),
//   biMap: <E2, B>(f: (_:E) => E2, g: (_:A) => B) => Arrow<D, E2, B, R>((_:D) => __val(_).then(a => a.biMap(f, g))),
//   flatMap: <D2 extends object, E2, B>(f: (_:A) => Arrow<D2, E2, B>):Arrow<D & D2, E | E2, B, R> => Arrow<D & D2, E | E2, B, R>(
//     (a: D & D2) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f(s2).__val(a)
//     ))
//   ),
//   // provideSome: <S extends Partial<R>>(ds: S) => Arrow<D, E, A, Omit<D, keyof S>>((d) => __val({ ...ds, ...d })),
//   // provideAll: (ds: R) => Arrow((d) => __val({ ...ds, ...d })),
//   flatMapF: <E2, B>(f: (_:A) => (_:D) => Promise<Either<E2, B>>):Arrow<D, E | E2, B, R> => Arrow<D, E | E2, B, R>(
//     (a: D) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f(s2)(a)
//     ))
//   ),
//   andThen: <D2 extends object, E2, B>(f: Arrow<D2, E2, B>):Arrow<D, E | E2, B, R> => Arrow<D, E | E2, B, R>(
//     (a: D) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f.__val({ ...a })
//     ))
//   ),
//   andThenF: <E2, B>(f: (_:A) => Promise<Either<E2, B>>):Arrow<D, E | E2, B, R> => Arrow<D, E | E2, B, R>(
//     (a: D) => __val(a).then((eitherD2): Promise<Either<E | E2, B>> => eitherD2.match(
//       e => Promise.resolve(Left(e)),
//       s2 => f(s2)
//     ))
//   ),
//   combine: <E2, B>(f:Arrow<D, E2, B>):Arrow<D, E2, A | B, R> => Arrow<D, E2, A | B, R>(
//     (c: D) => __val(c)
//       .then(
//         (eitherA): Promise<Either<E2, A | B>> => eitherA.match(
//           e => f.__val(c),
//           a => Promise.resolve(Right(a))
//         )
//       )
//   ),
//   runP: (
//     context: R
//   ) => __val(context as unknown as D).then(
//     (eitherD) => eitherD.match(
//       none => { throw none },
//       some => some
//     )
//   ),
//   // consider running shutdown somewhere or returning deps, e.g. remove db connection
//   run: <B, E2, ER>(
//     context: R,
//     f: (_:A) => B,
//     g: (_:E) => E2,
//     j: (_?: Error) => ER
//   ) => __val(context as unknown as D).then(
//     (eitherD) => eitherD.match(
//       none => g(none),
//       some => f(some)
//     )
//   )
//     .catch(
//       j
//     )
// })

// // constructors

// export const resolve = <A, E = never, D extends object = object>(a: A):Arrow<D, E, A> => Arrow(async (_:D) => Right(a))

// export const reject = <E, A = never, D extends object = object>(a: E):Arrow<D, E, A> => Arrow(async (_:D) => Left(a))

// // export const fromNullable = <A, B, C = any>(a: A | null | undefined): Arrow<C, null, A> => Arrow(async (_: C) => eitherFromNullable(a))

// export const fromPromise = <E = never, A = any, D extends object = object>(a: Promise<A>):Arrow<D, E, A> => Arrow(async (_:D) => a.then(Right).catch(Left))

// export const fromEither = <E, A, D extends object = object>(a:Either<E, A>):Arrow<D, E, A> => Arrow(async (_:any) => a)

// export const fromPromiseEither = <E, A, D extends object = object>(a:Promise<Either<E, A>>):Arrow<D, E, A> => Arrow((_:D) => a)

// // TODO: rename more friendly

// export const fromKP = <D extends object, A>(a:(_:D) => Promise<A>):Arrow<D, never, A> => Arrow((s: D) => a(s).then(Right))

// export const fromFailableKP = <D extends object, E, A>(a:(_:D) => Promise<A>):Arrow<D, E, A> => Arrow((s:D) => a(s).then(Right).catch((e) => Left<E>(e)))

// // combinators

// export const sequence = <D extends object, B, C>(as: Arrow<D, B, C>[]): Arrow<D, B, C[]> => as.reduce(
//   (acc, arrowA) => acc.flatMap((a) => arrowA.map(c => [...a, c])), Arrow<D, B, C[]>(async (_: D) => Right<C[]>([]))
// )

// export const combine = <D extends object, B, C>(...as: Arrow<D, B, C>[]): Arrow<D, B, C> => {
//   if (as.length === 1) return as[0]
//   if (as.length === 2) return as[0].combine(as[1])
//   const [a, b, ...aas] = as
//   return combine(a.combine(b), ...aas)
// }

// export const retry = (n: number) => <D extends object, B, C>(a: Arrow<D, B, C>): Arrow<D, B, C> => (n < 1 ? a : a.combine(retry(n - 1)(a)))


// // kleisli combinators

// export type ArrowK<D extends object, A, B, C> = (a: (A)) => Arrow<D, B, C>

// export function composeK <D1 extends object, A, B, C, D, E>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>): (d: A) => Arrow<D1, B | D, E>
// export function composeK <D1 extends object, A, B, C, D, E, F, G>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>): (d: A) => Arrow<D1, B | D | F, G>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>): (d: A) => Arrow<D1, B | D | F | H, I>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>): (d: A) => Arrow<D1, B | D | F | H | J, K>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>)
//   : (d: A) => Arrow<D1, B | D | F | H | J | L, M>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>)
//   : (d: A) => Arrow<D1, B | D | F | H | J | L | N, O>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>, h: ArrowK<D1, O, P, Q>)
//   : (d: A) => Arrow<D1, B | D | F | H | J | L | N | P, Q>
// export function composeK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>, h: ArrowK<D1, O, P, Q>, i: ArrowK<D1, Q, R, S>)
//   : (d: A) => Arrow<D1, B | D | F | H | J | L | N | P | R, S>
// export function composeK<A>(...as: any[]) {
//   return function (d: A) {
//     const [aa, ...aas] = as
//     if (aas && aas.length === 0) return aa(d)
//     return aa(d).flatMap(
//       // @ts-ignore
//       composeK(...aas)
//     )
//   }
// }

// export const sequenceK = <D extends object, C, E, A>(as: ArrowK<D, C, E, A>[]): ArrowK<D, C, E, A[]> => as.reduce(
//   (acc, teaK) => (_: C) => teaK(_).flatMap(a => acc(_).map(aas => [a, ...aas])), (_: C) => Arrow<D, E, A[]>(() => Promise.resolve(Right<A[]>([])))
// )

// export function combineK <D1 extends object, A, B, C, D, E>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, A, D, E>): (d: A) => Arrow<D1, D, C | E>
// export function combineK <D1 extends object, A, B, C, D, E, F, G>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, A, D, E>, c: ArrowK<D1, A, F, G>): (d: A) => Arrow<D1,F, C | E | G>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, A, D, E>, c: ArrowK<D1, A, F, G>, d: ArrowK<D1, A, H, I>): (d: A) => Arrow<D1, H, C | E | G | I>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, A, D, E>, c: ArrowK<D1, A, F, G>, d: ArrowK<D1, A, H, I>, e: ArrowK<D1, A, J, K>): (d: A) => Arrow<D1, J, C | E | G | I | K>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, A, D, E>, c: ArrowK<D1, A, F, G>, d: ArrowK<D1, A, H, I>, e: ArrowK<D1, A, J, K>, f: ArrowK<D1, A, L, M>)
//     : (d: A) => Arrow<D1, L, C | E | G | I | K | M>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>)
//     : (d: A) => Arrow<D1, N, C | E | G | I | K | M | O>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>, h: ArrowK<D1, O, P, Q>)
//     : (d: A) => Arrow<D1, P, C | E | G | I | K | M | O | Q>
// export function combineK <D1 extends object, A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(a: ArrowK<D1, A, B, C>, b: ArrowK<D1, C, D, E>, c: ArrowK<D1, E, F, G>, d: ArrowK<D1, G, H, I>, e: ArrowK<D1, I, J, K>, f: ArrowK<D1, K, L, M>, g: ArrowK<D1, M, N, O>, h: ArrowK<D1, O, P, Q>, i: ArrowK<D1, Q, R, S>)
//     : (d: A) => Arrow<D1, R, C | E | G | I | K | M | O | Q | S>
// export function combineK <D extends object, A>(...a: ArrowK<D, A, any, any>[]): ArrowK<D, A, any, any>
// export function combineK<D extends object, A>(...as: ArrowK<D, A, any, any>[]): ArrowK<D, A, any, any> {
//   if (as.length === 1) return as[0]
//   if (as.length === 2) return (c: A) => as[0](c).combine(as[1](c))
//   const [a, b, ...aas] = as
//   return combineK(combineK(a, b), ...aas)
// }

// export const retryK = (n: number) => <D extends object, C, E, A>(a: ArrowK<D, C, E, A>): ArrowK<D, C, E, A> => (n < 1 ? a : combineK(a, (retryK(n - 1)(a))))

// // type aliases

// export type ArTaskEither<E, A, D extends object = object> = Arrow<D, E, A>

// export type ArTask<A, D extends object = object> = ArTaskEither<D, A>

// // examples

// const a = Arrow(async (b: { c: string }) => Right(b))
//   .flatMap(() => Arrow(async (b: { b: number }) => Right(b)))

// type AccountModel = {
//   query: () => void
// }

// type HasAccountModel = {
//   accountModel: AccountModel
// }

// type EmailService = {
//   send: () => void
// }

// type HasEmailService = {
//   emailService: EmailService
// }

// const getAccount = <A extends object>(id: string) => Arrow(async (aa: A) => {
//   console.log('getAccount', aa)
//   return Right({ accountModel: { query: () => console.log('account') } })
// })

// const emailAccount = <A extends HasEmailService & HasAccountModel>(id: string) => Arrow(async (aa: A) => {
//   console.log('emailAccount', aa)
//   return Right(aa.emailService.send())
// })

// // const x = getAccount('yo').flatMap(() => emailAccount('xhe'))

// // const y = getAccount('yo')
// //   .andThen(emailAccount('xhe'))
// //   .runP({
// //     accountModel: { query: () => console.log('account') }
// //   })

// // // services

// // const emailClient = {
// //   emailClient: {
// //     send: 'string'
// //   }
// // }
