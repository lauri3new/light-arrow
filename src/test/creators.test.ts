
import {
  arrow, draw, drawAsync, drawEither,
  drawFailableAsync, drawFailableFunction, drawFunction,
  drawNullable,
  fail, succeed
} from '../arrow/creators'
import { Right } from '../either'

it('arrow should arrow', async () => {
  const result = await arrow<{}, never, number>(async () => Right(1))
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

it('arrow should draw from dependencies', async () => {
  const client = {
    send: (name: string) => succeed('success')
  }

  type Client = typeof client

  const sendViaClient = (name: string) => draw((client: Client) => client.send(name))
  const result = await sendViaClient('jj')
    .runAsPromiseResult(client)
  expect(result).toEqual('success')
})
