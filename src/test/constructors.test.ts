
import {
  Arrow, drawAsync, drawEither,
  drawFailableAsync, drawFailableFunction, drawFunction,
  drawNullable,
  fail, succeed
} from '../arrow/index'
import { Right } from '../either'

it('arrow should Arrow', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawAsync', async () => {
  const result = await drawAsync<number>(async () => 1)
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawFunction', async () => {
  const result = await drawFunction<number>(() => 1)
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawEither - right', async () => {
  const result = await drawEither<never, number>(Right(1))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawEither - left', async () => {
  const result = await drawEither<never, number>(Right(1))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawFailableAsync - success', async () => {
  const result = await drawFailableAsync<number>(async () => 1)
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawFailableAsync - failure', async () => {
  const result = await drawFailableAsync<number>(async () => 1)
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawFailableFunction - success', async () => {
  const result = await drawFailableFunction<number>(() => 1)
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should drawFailableFunction - failure', async () => {
  const { result, error } = await drawFailableFunction<number>(() => { throw new Error('boom') })
    .leftMap((e) => e.message)
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual('boom')
})

it('arrow should drawNullable - null', async () => {
  const { result, error } = await drawNullable<number>(null)
    .map((a:number) => a + 1)
    .leftMap((a) => 'its null')
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual('its null')
})

it('arrow should drawNullable - non null', async () => {
  const { result, error } = await drawNullable(1)
    .map((a) => a + 1)
    .leftMap((a) => 'its null')
    .runAsPromise({})
  expect(result).toEqual(2)
  expect(error).toEqual(undefined)
})

it('arrow should succeed', async () => {
  const { result, error } = await succeed(1)
    .map((a) => a + 1)
    .runAsPromise({})
  expect(error).toEqual(undefined)
  expect(result).toEqual(2)
})

it('arrow should fail', async () => {
  const { result, error } = await fail(1)
    .map((a) => a + 1)
    .runAsPromise({})
  expect(error).toEqual(1)
  expect(result).toEqual(undefined)
})
