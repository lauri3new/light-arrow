
import {
  andThen, Arrow, orElse, repeat, retry, sequence
} from '../arrow/index'
import { Left, Right } from '../either'

it('arrow should orElse', async () => {
  const a = await Arrow<{}, number, never>(async () => Left(1))
  const b = await Arrow<{}, never, number>(async () => Right(1))

  const result = await orElse(
    a,
    a,
    b
  )
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should andThen', async () => {
  const a = await Arrow<{ num: number }, never, { num: number }>(async ({ num }) => Right({ num: num + 1 }))

  const result = await andThen(
    a,
    a,
    a
  )
    .runAsPromiseResult({ num: 2 })
  expect(result).toEqual({ num: 5 })
})

it('arrow should sequence', async () => {
  const a = Arrow(async () => Right(3))

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
  const a = Arrow<{}, never, void>(async () => {
    count += 1
    return Right(undefined)
  })

  await repeat(100)(a)
    .runAsPromiseResult({})
  expect(count).toEqual(100)
})

it('arrow should retry', async () => {
  let count = 0
  const a = Arrow<{}, void, void>(async () => {
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
