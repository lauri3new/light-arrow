import { reject } from '../arrow/creators'
import { Arrow, provideAll, provideSome, provideSomeA, resolve } from '../arrow/index'
import { Left, Right } from '../either'
import { sleep } from './helpers'

it('Arrow should map', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .map(a => a * 3)
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('Arrow should tap', async () => {
  let i = 0
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .map(a => a * 3)
    .tap(a => {
      i = a
    })
    .runAsPromiseResult({})
  expect(result).toEqual(3)
  expect(i).toEqual(3)
})

it('Arrow should be immutable', async () => {
  const a = Arrow<{}, never, number>(async () => Right(1))
  const result = await a
    .map(a => a * 2)
    .runAsPromiseResult({})
  expect(result).toEqual(2)

  const result1 = await a
    .map(a => a * 3)
    .runAsPromiseResult({})
  expect(result1).toEqual(3)
})

it('Arrow should map - fail', async () => {
  const { error, result } = await Arrow<{}, never, number>(async () => Right(1))
    .flatMap(() => Arrow<{}, number, never>(async () => Left(1)))
    .map(a => a * 3)
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(1)
})

it('Arrow should flatMap', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .flatMap(a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('Arrow should flatMap - fail', async () => {
  const { error, result } = await Arrow<{}, number, never>(async () => Left(1))
    .flatMap(a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromise({})
  expect(result).toEqual(undefined)
  expect(error).toEqual(1)
})

it('Arrow should flatMapIf - true', async () => {
  const condition: boolean = true
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .flatMapIf(condition, a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('Arrow should flatMapIf - false', async () => {
  const condition: boolean = false
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .flatMapIf(condition, a => Arrow<{}, never, number>(async () => Right(a * 3)))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('Arrow should leftMap', async () => {
  const {
    error
  } = await Arrow<{}, number, never>(async () => Left(1))
    .leftMap(a => a * 3)
    .runAsPromise({})
  expect(error).toEqual(3)
})

it('Arrow should leftFlatMap', async () => {
  const {
    error
  } = await Arrow<{}, number, never>(async () => Left(1))
    .leftFlatMap(a => resolve(a * 3))
    .runAsPromise({})
  expect(error).toEqual(3)
})

it('Arrow should leftFlatMap - right', async () => {
  const {
    error
  } = await Arrow<{}, never, number>(async () => Right(1))
    .leftFlatMap(a => resolve(a * 3))
    .runAsPromise({})
  expect(error).toEqual(undefined)
})

it('Arrow should biMap - right', async () => {
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

it('Arrow should biMap - left', async () => {
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

it('Arrow should group', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('Arrow should group - fail', async () => {
  const { result, error } = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, number, never>(async () => Left(2)))
    .runAsPromise({})
  expect(result).toEqual(1)
  expect(error).toEqual(2)
})

it('Arrow should group first', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .groupFirst(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('Arrow should group second', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .groupSecond(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('Arrow should group', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .group(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual([1, 2])
})

it('Arrow should andThen', async () => {
  const result = await Arrow<{}, never, number>(async () => Right(1))
    .andThen(Arrow<number, never, number>(async (a) => Right(a + 2)))
    .runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('Arrow should orElse', async () => {
  const result = await Arrow<{}, number, never>(async () => Left(1))
    .orElse(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('Arrow should orElse', async () => {
  const a = Arrow<{}, number, never>(async () => Left(1))
    .orElse(Arrow<{}, number, never>(async () => Left(2)))

  const result = await a.orElse(Arrow<{}, never, number>(async () => Right(2)))
    .runAsPromiseResult({})
  expect(result).toEqual(2)
})

it('Arrow should ifOrElse', async () => {
  const a = Arrow<{}, string, never>(async () => Left('hey'))
    .ifOrElse(c => c === 'wasup', Arrow<{}, string, never>(async () => Left('yo')))

    const { error } = await a
    .runAsPromise({})
  expect(error).toEqual('hey')
})

it('Arrow should ifOrElse', async () => {
  const a = Arrow<{}, string, never>(async () => Left('hey'))
    .ifOrElse(c => c === 'hey', Arrow<{}, string, never>(async () => Left('yo')))

  const { error } = await a
    .runAsPromise({})
  expect(error).toEqual('yo')
})


it('Arrow should bracket', async () => {
  let flag = false
  const a = Arrow<{}, never, { ok: number }>(async () => Right({ ok: 123 }))
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

it('Arrow should bracket - fail case', async () => {
  let flag = false
  const a = Arrow<{}, never, { ok: number }>(async () => Right({ ok: 123 }))
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

it('Arrow should run - success', async () => {
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

it('Arrow should run - error', async () => {
  const a = Arrow<{ok:() => number }, number, never>(async (a) => Left(a.ok()))
  const result = a.run(
    { ok: () => 2 },
    result => { },
    error => {
      expect(error).toEqual(2)
    },
    failure => { }
  )
})

it('Arrow should run - failure', async () => {
  const a = Arrow<{ok:() => number }, number, never>(async (a) => { throw new Error('boom') })
  const result = a.run(
    { ok: () => 2 },
    result => { },
    error => { },
    failure => {
      expect(failure?.message).toEqual('boom')
    }
  )
})

it('Arrow should run - context', async () => {
  const a = Arrow<{ok:() => number }, never, number>(async (a) => Right(a.ok()))
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

it('Arrow should run no cancel', async () => {
  let res = 0
  const a = Arrow<{ok:() => number }, never, number>(async (a) => {
    await sleep(100)
    return Right(a.ok())
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

it('Arrow should run and cancel', async () => {
  let res = 0
  const a = Arrow<{ok:() => number }, never, number>(async (a) => {
    await sleep(100)
    res = 2
    return Right(a.ok())
  })
  const cancel = await a.run(
    { ok: () => 2 },
    result => {
      res = result
    },
    error => { }
  )
  cancel()
  await sleep(200)
  expect(res).toEqual(0)
})


it('Arrow should run as promise result - success', async () => {
  const a = Arrow<{ok:() => number }, never, number>(async (a) => Right(a.ok()))
  const result = await a.runAsPromiseResult({ ok: () => 2 })
  expect(result).toEqual(2)
})

it('provide should eliminate dependency', async () => {
  type depA = { ok:() => number }
  type depB = { nok: () => string }
  type twoDeps = depA & depB
  const a = Arrow<twoDeps, never, number>(async (a) => Right(a.ok()))
  const x = provideSome({ ok: () => 3 } as depA)(a)
  const result = await x.runAsPromiseResult({ nok: () => 'yahoo' })
  expect(result).toEqual(3)
})

it('provide should eliminate dependency', async () => {
  type depA = { ok:() => number }
  type depB = { nok: () => string }
  type twoDeps = depA & depB
  const a = Arrow<twoDeps, never, number>(async (a) => Right(a.ok()))
  const x = provideSome({ ok: () => 3 } as depA)(a)
  const result = await x.runAsPromiseResult({ nok: () => 'yahoo' })
  expect(result).toEqual(3)
})

it('provide should eliminate dependency', async () => {
  type depA = { ok:() => number }
  type depB = { nok: () => string }
  type twoDeps = depA & depB
  const a = Arrow<twoDeps, never, number>(async (a) => Right(a.ok()))
  const x = provideSome({ ok: () => 3, nok: () => 'yo' } as twoDeps)<{}, never, number>(a)
  const ok = resolve({}).andThen(x)
  const result = await ok.runAsPromiseResult({})
  expect(result).toEqual(3)
})

it('provideSomeA should eliminate dependency', async () => {
  type depA = { ok:() => number }
  type depB = { nok: () => string }
  type depC = { x: string }
  type twoDeps = depA & depB
  const a = Arrow(async (a: twoDeps) => Right(a.ok()))
  const pa =  Arrow(async (a: depC) => Right({ ok: () => 3 } as depA))
  const x = provideSomeA(pa)(a)
  const result = await x.runAsPromiseResult({ nok: () => 'yahoo', x: 'x' })
  expect(result).toEqual(3)
})


it('Arrow should preserve basic type dep', async () => {
  const result = await Arrow<string, never, number>(async () => Right(1))
    .map(a => a * 3)
    .flatMap(() => Arrow<string, never, string>(async (a) => Right(a)))
    .runAsPromiseResult("hey")
  expect(result).toEqual("hey")
})

it('Arrow should preserve basic type dep', async () => {
  const result = await Arrow<string, never, number>(async () => Right(1))
    .map(a => a * 3)
    .flatMap(() => provideSome("xhe")(Arrow<string, never, string>(async (a) => Right(a))))
    .runAsPromiseResult("hey")
  expect(result).toEqual("xhe")
})

it('provide should eliminate all dependencies', async () => {
  type depA = { ok:() => number }
  type depB = { nok: () => string }
  type twoDeps = depA & depB
  const a = Arrow<twoDeps, never, number>(async (a) => Right(a.ok()))
  const x = provideAll({ ok: () => 3, nok: () => 'string' } as twoDeps)(a)
  const result = await x.runAsPromiseResult({})
  expect(result).toEqual(3)
})