import { Right } from '../either/index'
import { Arrow } from './index'

/**
 * Returns an Arrow that will return the result value of the first succesful Arrow.
 */
export function orElse <D1, E1, R1, D2, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>): Arrow<D1 & D2, E2, R1 | R2>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>): Arrow<D1 & D2 & D3, E3, R1 | R2 | R3>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>): Arrow<D1 & D2 & D3 & D4, E4, R1 | R2 | R3 | R4>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>): Arrow<D1 & D2 & D3 & D4 & D5, E5, R1 | R2 | R3 | R4 | R5>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6, E6, R1 | R2 | R3 | R4 | R5 | R6>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7, E7, R1 | R2 | R3 | R4 | R5 | R6 | R7>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>, h: Arrow<D8, E8, R8>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8, E8, R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8>
export function orElse <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<D2, E2, R2>, c: Arrow<D3, E3, R3>, d: Arrow<D4, E4, R4>, e: Arrow<D5, E5, R5>, f: Arrow<D6, E6, R6>, g: Arrow<D7, E7, R7>, h: Arrow<D8, E8, R8>, i: Arrow<D9, E9, R9>)
  : Arrow<D1 & D2 & D3 & D4 & D5 & D6 & D7 & D8 & D9, E9, R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9>
export function orElse(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].orElse(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return orElse(a.orElse(b), ...aas)
}

/**
 * Provides the result of the first Arrow as the dependencies of the next Arrow, allowing 'start to end' composition.
 */
export function andThen <D1, E1, R1, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>): Arrow<D1, E1 | E2, R2>
export function andThen <D1, E1, R1, E2, R2, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>): Arrow<D1, E1 | E2 | E3, R3>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>): Arrow<D1, E1 | E2 | E3 | E4, R4>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, R5>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, R6>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, R7>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, R8>
export function andThen <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>, i: Arrow<R8, E9, R9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, R9>
export function andThen(...as: any[]) {
  if (as.length === 1) return as[0]
  if (as.length === 2) return as[0].andThen(as[1])
  const [a, b, ...aas] = as
  // @ts-ignore
  return andThen(a.andThen(b), ...aas)
}

/**
 * Returns an Arrow with the result values in a tuple of the grouped Arrows.
 */
export function group <D1, E1, R1, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>): Arrow<D1, E1 | E2, [R1, R2]>
export function group <D1, E1, R1, E2, R2, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>): Arrow<D1, E1 | E2 | E3, [R1, R2, R3]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>): Arrow<D1, E1 | E2 | E3 | E4, [R1, R2, R3, R4]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, [R1, R2, R3, R4, R5]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, [R1, R2, R3, R4, R5, R6]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, [R1, R2, R3, R4, R5, R6, R7]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, [R1, R2, R3, R4, R5, R6, R7, R8]>
export function group <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>, i: Arrow<R8, E9, R9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>
export function group(...as: Arrow<any, any, any>[]) {
  function runGroup(as: Arrow<any, any, any>[], first: boolean): any {
    if (as.length === 1) return as[0]
    if (as.length === 2 && first) return as[0].group(as[1])
    if (as.length === 2) return as[0].group(as[1]).map(([c1, c2]) => [...c1, c2])
    const [a, b, ...aas] = as
    if (first) {
      return runGroup([a.group(b), ...aas], false)
    }
    return runGroup([a.group(b).map(([c1, c2]) => [...c1, c2]), ...aas], false)
  }
  return runGroup(as, true)
}

/**
 * Returns an Arrow with the result values in a tuple of the two grouped Arrows, running the operations in parallel.
 */
export function groupParallel <D1, E1, R1, E2, R2>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>): Arrow<D1, E1 | E2, [R1, R2]>
export function groupParallel <D1, E1, R1, E2, R2, E3, R3>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>): Arrow<D1, E1 | E2 | E3, [R1, R2, R3]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>): Arrow<D1, E1 | E2 | E3 | E4, [R1, R2, R3, R4]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>): Arrow<D1, E1 | E2 | E3 | E4 | E5, [R1, R2, R3, R4, R5]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6, [R1, R2, R3, R4, R5, R6]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7, [R1, R2, R3, R4, R5, R6, R7]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8, [R1, R2, R3, R4, R5, R6, R7, R8]>
export function groupParallel <D1, E1, R1, D2, E2, R2, D3, E3, R3, D4, E4, R4, D5, E5, R5, D6, E6, R6, D7, E7, R7, D8, E8, R8, D9, E9, R9>(a: Arrow<D1, E1, R1>, b: Arrow<R1, E2, R2>, c: Arrow<R2, E3, R3>, d: Arrow<R3, E4, R4>, e: Arrow<R4, E5, R5>, f: Arrow<R5, E6, R6>, g: Arrow<R6, E7, R7>, h: Arrow<R7, E8, R8>, i: Arrow<R8, E9, R9>)
  : Arrow<D1, E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9, [R1, R2, R3, R4, R5, R6, R7, R8, R9]>
export function groupParallel(...as: Arrow<any, any, any>[]) {
  function runGroup(as: Arrow<any, any, any>[], first: boolean): any {
    if (as.length === 1) return as[0]
    if (as.length === 2 && first) return as[0].groupParallel(as[1])
    if (as.length === 2) return as[0].groupParallel(as[1]).map(([c1, c2]) => [...c1, c2])
    const [a, b, ...aas] = as
    if (first) {
      return runGroup([a.groupParallel(b), ...aas], false)
    }
    return runGroup([a.groupParallel(b).map(([c1, c2]) => [...c1, c2]), ...aas], false)
  }
  return runGroup(as, true)
}

/**
 * Convert a array of arrows into a single Arrow returning a array of result (R) values, running the operations in sequence.
 */
export const sequence = <D, E, R>(as: Arrow<D, E, R>[]): Arrow<D, E, R[]> => as.reduce(
  (acc, arrowR) => acc.flatMap((a: any) => arrowR.map(c => [...a, c])), Arrow<D, E, R[]>(async (_: D) => Right<R[]>([]))
)

/**
 * Returns an Arrow that will repeat the operation and returns with the result value of the last Arrow.
 */
export const retry = (n: number) => <D, E, R>(a: Arrow<D, E, R>): Arrow<D, E, R> => (n === 1 ? a : a.orElse(retry(n - 1)(a)))

/**
 * Returns an Arrow that will repeat the operation until first succesful run.
 */
export const repeat = (n: number) => <D, E, R>(a: Arrow<D, E, R>): Arrow<D, E, R> => (n === 1 ? a : a.groupSecond(repeat(n - 1)(a)))
