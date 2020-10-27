import { performance } from 'perf_hooks'
import {
  andThen, Arrow, arrow, orElse, repeat, retry, sequence
} from '../arrow/index'
import { Left, Right } from '../either'
import { sleep } from './helpers'

it('arrow should orElse', async () => {
  const a = await arrow<{}, number, never>(async () => Left(1))
  const b = await arrow<{}, never, number>(async () => Right(1))

  const result = await orElse(
    a,
    a,
    b
  )
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should andThen', async () => {
  const a = await arrow<{ num: number }, never, { num: number }>(async ({ num }) => Right({ num: num + 1 }))

  const result = await andThen(
    a,
    a,
    a
  )
    .runAsPromiseResult({ num: 2 })
  expect(result).toEqual({ num: 5 })
})

it('arrow should sequence', async () => {
  const a = arrow(async () => Right(3))

  const result = await sequence(
    [
      a,
      a,
      a
    ]
  )
    .runAsPromiseResult({})

  expect(result).toEqual([3, 3, 3])
})

it('arrow should repeat', async () => {
  let count = 0
  const a = arrow<{}, never, void>(async () => {
    count += 1
    return Right(undefined)
  })

  await repeat(100)(a)
    .runAsPromiseResult({})
  expect(count).toEqual(100)
})

it('arrow should retry', async () => {
  let count = 0
  const a = arrow<{}, void, void>(async () => {
    count += 1
    if (count > 2) {
      return Right(undefined)
    }
    return Left(undefined)
  })
  const c = retry(4)(a)
  await c
    .runAsPromiseResult({})
  expect(count).toEqual(3)
})

it('arrow should all', async () => {
  const a = arrow(async () => {
    await sleep(100)
    return Right(3)
  })
  const p1 = performance.now()
  const result = await Arrow.all(
    [
      a,
      a,
      a
    ]
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3])
  expect(p2 - p1 < 200)
})

it('arrow should all with concurrency limit', async () => {
  const a = arrow(async () => {
    await sleep(100)
    return Right(3)
  })
  const p1 = performance.now()
  const result = await Arrow.all(
    [
      a,
      a,
      a,
      a,
      a,
      a
    ],
    3
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3, 3, 3, 3])
  expect(p2 - p1 < 300).toBe(true)
})

it('arrow should race', async () => {
  const p1 = performance.now()
  const result = await Arrow.race(
    [
      arrow(async () => {
        await sleep(300)
        return Right(3)
      }),
      arrow(async () => {
        await sleep(100)
        return Right(3)
      }),
      arrow(async () => {
        await sleep(600)
        return Right(3)
      })
    ]
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual(3)
  expect(p2 - p1 < 200).toBe(true)
})
