import { Arrow } from '../arrow/index'
import { Left, Right } from '../either'

it('arrow should map', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .map(a => a * 3)
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('arrow should map - fail', async () => {
  const { error, result } = await Arrow<{}, never, number>(async () => Right(1))
    .flatMap(() => Arrow<{}, number, never>(async () => Left(1)))
    .map(a => a * 3)
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(1)
})

it('arrow should flatMap', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .flatMap(a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('arrow should flatMap - fail', async () => {
  const { error, result } = await Arrow<{}, number, never>(async () => Left(1))
    .flatMap(a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(1)
})

it('arrow should leftMap', async () => {
  const {
    error
  } = await Arrow<{}, number, never>(async () => Left(1))
    .leftMap(a => a * 3)
    .runAsPromise({})
  expect(error).toEqual(3)
})

it('arrow should biMap - right', async () => {
  const {
    error, result
  } = await Arrow<{}, never, number>(async () => Right(1))
    .biMap(
      a => a * 3,
      a => a * 5
    )
    .runAsPromise({})
  expect(result).toEqual(5)
  expect(error).toEqual(undefined)
})

it('arrow should biMap - left', async () => {
  const {
    error, result
  } = await Arrow<{}, number, never>(async () => Left(1))
    .biMap(
      a => a * 3,
      a => a * 5
    )
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(3)
})

it('arrow should group', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('arrow should group - fail', async () => {
  const { result, error } = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, number, never>(async () => Left(2)))
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(2)
})

it('arrow should group first', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .groupFirst(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('arrow should group second', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .groupSecond(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('arrow should group', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('arrow should andThen', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .andThen(Arrow<number, never, number>(async (a) => Right(a + 2)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('arrow should orElse', async () => {
  const result = await Arrow<{}, number, never>(async () => Left(1))
    .orElse(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('arrow should orElse', async () => {
  const a = Arrow<{}, number, never>(async () => Left(1))
    .orElse(Arrow<{}, number, never>(async () => Left(2)))

  const result = await a.orElse(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('arrow should run - success', async () => {
  const a = Arrow<{ok:() => number }, never, number>(async (a) => Right(a.ok()))
  const result = await a.run(
    { ok: () => 2 },
    result => {
      expect(result).toEqual(2)
    },
    error => { },
    failure => { }
  )
})

it('arrow should run - error', async () => {
  const a = Arrow<{ok:() => number }, number, never>(async (a) => Left(a.ok()))
  const result = await a.run(
    { ok: () => 2 },
    result => { },
    error => {
      expect(error).toEqual(2)
    },
    failure => { }
  )
})

it('arrow should run - failure', async () => {
  const a = Arrow<{ok:() => number }, number, never>(async (a) => { throw new Error('boom') })
  const result = await a.run(
    { ok: () => 2 },
    result => { },
    error => { },
    failure => {
      expect(failure?.message).toEqual('boom')
    }
  )
})

it('arrow should run - context', async () => {
  const a = Arrow<{ok:() => number }, never, number>(async (a) => Right(a.ok()))
  const result = await a.run(
    { ok: () => 2 },
    result => {
      expect(result).toEqual(2)
    },
    error => { },
    failure => { },
    context => {
      expect(context.ok()).toEqual(2)
    }
  )
})

it('arrow should run as promise result - success', async () => {
  const a = Arrow<{ok:() => number }, never, number>(async (a) => Right(a.ok()))
  const result = await a.runAsPromiseResult({ ok: () => 2 })
  expect(result).toEqual(2)
})
