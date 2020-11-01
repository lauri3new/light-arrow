import { reject } from '../arrow/creators'
import { Arrow, construct, constructTask, resolve } from '../arrow/index'
import { Left, Right } from '../either'
import { sleep } from './helpers'

it('constructTask should map', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .map(a => a * 3)
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('constructTask should map - fail', async () => {
  const { error, result } = await constructTask<{}, never, number>((res) => res(1))
    .flatMap(() => constructTask<{}, number, never>((_, rej) => rej(1)))
    .map(a => a * 3)
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(1)
})

it('constructTask should flatMap', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .flatMap(a => constructTask<{}, never, number>((res) => res(a * 3)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('constructTask should flatMap - fail', async () => {
  const { error, result } = await constructTask<{}, number, never>((_, rej) => rej(1))
    .flatMap(a => constructTask<{}, never, number>((res) => res(a * 3)))
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(1)
})

it('constructTask should leftMap', async () => {
  const {
    error
  } = await constructTask<{}, number, never>((_, rej) => rej(1))
    .leftMap(a => a * 3)
    .runAsPromise({})
  expect(error).toEqual(3)
})

it('constructTask should biMap - right', async () => {
  const {
    error, result
  } = await constructTask<{}, never, number>((res) => res(1))
    .biMap(
      a => a * 3,
      a => a * 5
    )
    .runAsPromise({})
  expect(result).toEqual(5)
  expect(error).toEqual(undefined)
})

it('constructTask should biMap - left', async () => {
  const {
    error, result
  } = await constructTask<{}, number, never>((_, rej) => rej(1))
    .biMap(
      a => a * 3,
      a => a * 5
    )
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(3)
})

it('constructTask should group', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .group(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('constructTask should group - fail', async () => {
  const { result, error } = await constructTask<{}, never, number>((res) => res(1))
    .group(constructTask<{}, number, never>((_, rej) => rej(2)))
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(2)
})

it('constructTask should group first', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .groupFirst(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('constructTask should group second', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .groupSecond(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('constructTask should group', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .group(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('constructTask should andThen', async () => {
  const result = await constructTask<{}, never, number>((res) => res(1))
    .andThen(Arrow<number, never, number>(async (a) => Right(a + 2)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('constructTask should orElse', async () => {
  const result = await constructTask<{}, number, never>((_, rej) => rej(1))
    .orElse(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('constructTask should orElse', async () => {
  const a = constructTask<{}, number, never>((_, rej) => rej(1))
    .orElse(Arrow<{}, number, never>(async () => Left(2)))

  const result = await a.orElse(constructTask<{}, never, number>((res) => res(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('constructTask should bracket', async () => {
  let flag = false
  const a = constructTask<{}, never, { ok: number }>((res) => res({ ok: 123 }))
    .bracket(
      (b) => {
        expect(flag).toEqual(false)
        flag = true
        return resolve(null)
      }
    )((c) => {
      expect(flag).toEqual(false)
      return resolve<number, {}>(10)
    })
  const { result, context } = await a
    .runAsPromise({})
  expect(flag).toEqual(true)
  expect(result).toEqual(10)
})

it('constructTask should bracket - fail case', async () => {
  let flag = false
  const a = constructTask<{}, never, { ok: number }>((res) => res({ ok: 123 }))
    .bracket(
      (b) => {
        expect(flag).toEqual(false)
        flag = true
        return resolve(null)
      }
    )(
      (c) => {
        expect(flag).toEqual(false)
        return reject(10)
      }
    )
  const { result, error, context } = await a
    .runAsPromise({})
  expect(flag).toEqual(true)
  expect(error).toEqual(10)
})

it('constructTask should run - success', async () => {
  const a = construct<{ok:() => number }, never, number>((a) => (res) => res(a.ok()))
  const result = await a.run(
    { ok: () => 2 },
    result => {
      expect(result).toEqual(2)
    },
    error => { },
    failure => { }
  )
})

it('constructTask should run - error', async () => {
  const a = construct<{ok:() => number }, number, never>((a) => (_, rej) => rej(a.ok()))
  const result = a.run(
    { ok: () => 2 },
    result => { },
    error => {
      expect(error).toEqual(2)
    },
    failure => { }
  )
})

it('constructTask should run - failure', async () => {
  try {
    const a = construct<{ok:() => number }, any, never>((a) => (_, rej) => { rej('boom') })
    const result = a.run(
      { ok: () => 2 },
      result => { },
      error => { },
      failure => {
        expect(failure?.message).toEqual('boom')
      }
    )
  } catch (e) {
    console.log('exploded', e)
  }
})

it('constructTask should run - context', async () => {
  const a = construct<{ok:() => number }, never, number>((a) => (res) => res(a.ok()))
  const result = a.run(
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

it('constructTask should run no cancel', async () => {
  let res = 0
  const a = construct<{ok:() => number }, never, number>((a) => (res) => {
    sleep(100).then(() => res(a.ok()))
  })
  const cancel = await a.run(
    { ok: () => 2 },
    result => {
      res = result
      expect(result).toEqual(2)
    },
    error => { }
  )
  await sleep(200)
  expect(res).toEqual(2)
})

it('constructTask should run and cancel', async () => {
  let r = 0
  const a = construct<{ok:() => number }, never, number>((a) => (res) => {
    sleep(100).then(() => {
      r = 2
      res(a.ok())
    })
  })
  const cancel = await a.run(
    { ok: () => 2 },
    result => {
      r = result
    },
    error => { }
  )
  cancel()
  await sleep(200)
  expect(r).toEqual(0)
})


it('constructTask should run as promise result - success', async () => {
  const a = construct<{ok:() => number }, never, number>((a) => (res) => res(a.ok()))
  const result = await a.runAsPromiseResult({ ok: () => 2 })
  expect(result).toEqual(2)
})
