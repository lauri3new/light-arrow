import { performance } from 'perf_hooks'
import {
  andThen, group, groupParallel, ifOrElse, orElse, repeat, retry, sequence
} from '../arrow/combinators'
import { all, Arrow, race } from '../arrow/index'
import { Left, Right } from '../either'
import { sleep } from './helpers'

it('Arrow should orElse', async () => {
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

it('Arrow should ifOrElse', async () => {
  const a = await Arrow<{}, number, never>(async () => Left(2))
  const b = await Arrow<{}, never, string>(async () => Right('hey'))

  const { result, error } = await ifOrElse(
    a => a === 1,
    a,
    b
  )
    .runAsPromise({})
  expect(error).toEqual(2)
  expect(result).toBeUndefined()
})


it('Arrow should ifOrElse', async () => {
  const a = await Arrow<{}, number, never>(async () => Left(2))
  const b = await Arrow<{}, never, string>(async () => Right('hey'))

  const { result, error } = await ifOrElse(
    a => a === 2,
    a,
    b
  )
    .runAsPromise({})
  expect(result).toEqual('hey')
  expect(error).toBeUndefined()
})


it('Arrow should andThen', async () => {
  const a = await Arrow<{ num: number }, never, { num: number }>(async ({ num }) => Right({ num: num + 1 }))

  const result = await andThen(
    a,
    a,
    a
  )
    .runAsPromiseResult({ num: 2 })
  expect(result).toEqual({ num: 5 })
})

it('Arrow should sequence', async () => {
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

it('Arrow should repeat', async () => {
  let count = 0
  const a = Arrow<{}, never, void>(async () => {
    count += 1
    return Right(undefined)
  })

  await repeat(100)(a)
    .runAsPromiseResult({})
  expect(count).toEqual(100)
})

it('Arrow should retry', async () => {
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

it('Arrow should all', async () => {
  const a = Arrow(async () => {
    await sleep(100)
    return Right(3)
  })
  const p1 = performance.now()
  const result = await all(
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

it('Arrow should all - cancel on exception', async () => {
  let i = 0
  const result = await all(
    [
      Arrow(async () => {
        await sleep(100)
        i += 1
        throw new Error('boom')
      }),
      Arrow(async () => {
        await sleep(10)
        i += 1
        return Right(null)
      }),
      Arrow(async () => {
        await sleep(200)
        i += 1
        return Right(null)
      })
    ]
  )
    .runAsPromise({})
  expect(i).toEqual(2)
})

it('Arrow should all - cancel on error', async () => {
  let i = 0
  const result = await all(
    [
      Arrow(async () => {
        await sleep(100)
        i += 1
        return Left(null)
      }),
      Arrow(async () => {
        await sleep(10)
        i += 1
        return Right(null)
      }),
      Arrow(async () => {
        await sleep(200)
        i += 1
        return Right(null)
      })
    ]
  )
    .runAsPromise({})
  expect(i).toEqual(2)
})

it('Arrow should all with concurrency limit', async () => {
  const a = Arrow(async () => {
    await sleep(100)
    return Right(3)
  })
  const p1 = performance.now()
  const result = await all(
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

it('Arrow should race', async () => {
  const p1 = performance.now()
  const result = await race(
    [
      Arrow(async () => {
        await sleep(300)
        return Right(3)
      }),
      Arrow(async () => {
        await sleep(100)
        return Right(3)
      }),
      Arrow(async () => {
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

it('Arrow should all concurrent - cancel on exception', async () => {
  let i = 0
  const result = await all(
    [
      Arrow(async () => {
        await sleep(100)
        i += 1
        throw new Error('boom')
      }),
      Arrow(async () => {
        await sleep(10)
        i += 1
        return Right(null)
      }),
      Arrow(async () => {
        await sleep(200)
        i += 1
        return Right(null)
      })
    ],
    2
  )
    .runAsPromise({})
  expect(i).toEqual(2)
})

it('Arrow should all concurrent - cancel on error', async () => {
  let i = 0
  const result = await all(
    [
      Arrow(async () => {
        await sleep(100)
        i += 1
        return Left(null)
      }),
      Arrow(async () => {
        await sleep(10)
        i += 1
        return Right(null)
      }),
      Arrow(async () => {
        await sleep(200)
        i += 1
        return Right(null)
      })
    ],
    2
  )
    .runAsPromise({})
  expect(i).toEqual(2)
})


it('Arrow should group (in sequence)', async () => {
  const p1 = performance.now()
  const result = await group(
    Arrow(async () => {
      await sleep(300)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(100)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(600)
      return Right(3)
    })
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3])
  expect(p2 - p1 < 1100).toBe(true)
  expect(p2 - p1 > 1000).toBe(true)
})

it('Arrow should groupParallel', async () => {
  const p1 = performance.now()
  const result = await groupParallel(
    Arrow(async () => {
      await sleep(300)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(100)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(100)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(100)
      return Right(3)
    }),
    Arrow(async () => {
      await sleep(600)
      return Right(3)
    })
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3, 3, 3])
  expect(p2 - p1 < 700).toBe(true)
  expect(p2 - p1 > 600).toBe(true)
})
