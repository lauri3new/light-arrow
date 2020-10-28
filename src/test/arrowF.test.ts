import { arrow } from '../arrow/creators'
import { Left, Right } from '../either'

it('arrow should flatMapF', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
    .flatMapF(a => async () => Right(a * 3))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('arrow should flatMapF - dependency', async () => {
  const result = await arrow<{abc:() => 123}, never, number>(async () => Right(1))
    .flatMapF(a => async (b: {abc:() => 123}) => Right(a * 3 + b.abc()))
    .runAsPromiseResult({ abc: () => 123 })
  expect(result).toEqual(126)
})

it('arrow should flatMapF - fail', async () => {
  const { error, result } = await arrow<{}, number, never>(async () => Left(1))
    .flatMapF(a => async () => Right(a * 3))
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(1)
})

it('arrow should groupF', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
    .groupF(async () => Right(2))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('arrow should groupF - fail', async () => {
  const { result, error } = await arrow<{}, never, number>(async () => Right(1))
    .groupF(async () => Left(2))
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(2)
})

it('arrow should group firstF', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
    .groupFirstF(async () => Right(2))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should group secondF', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
    .groupSecondF(async () => Right(2))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('arrow should andThenF', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
    .andThenF(async (a) => Right(a + 2))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('arrow should orElseF', async () => {
  const result = await arrow<{}, number, never>(async () => Left(1))
    .orElseF(async () => Right(2))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('arrow should orElseF', async () => {
  const a = arrow<{}, number, never>(async () => Left(1))
    .orElseF(async () => Left(2))

  const result = await a.orElseF(async () => Right(2))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})
