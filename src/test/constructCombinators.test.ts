import { performance } from 'perf_hooks'
import {
  andThen, group, groupParallel, orElse, repeat, retry, sequence
} from '../arrow/combinators'
import {
  all, Arrow, construct, constructTask, race
} from '../arrow/index'
import { Right } from '../either'
import { sleep } from './helpers'

it('Arrow should orElse', async () => {
  const a = await constructTask<{}, number, never>((_, rej) => {
    rej(1)
  })
  const b = await constructTask<{}, never, number>((res) => {
    res(1)
  })

  const result = await orElse(
    a,
    a,
    b
  )
    .runAsPromiseResult({})
  expect(result).toEqual(1)
})

it('Arrow should andThen', async () => {
  const a = await construct<{ num: number }, never, { num: number }>(({ num }) => (res) => res({ num: num + 1 }))

  const result = await andThen(
    a,
    a,
    a
  )
    .runAsPromiseResult({ num: 2 })
  expect(result).toEqual({ num: 5 })
})

it('Arrow should sequence', async () => {
  const a = constructTask((res) => res(3))

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
  const a = constructTask<{}, never, void>((res) => {
    count += 1
    res(undefined)
  })

  await repeat(100)(a)
    .runAsPromiseResult({})
  expect(count).toEqual(100)
})

it('Arrow should retry', async () => {
  let count = 0
  const a = constructTask<{}, void, void>((res, rej) => {
    count += 1
    if (count > 2) {
      return res(undefined)
    }
    return rej(undefined)
  })
  const c = retry(4)(a)
  await c
    .runAsPromiseResult({})
  expect(count).toEqual(3)
})

it('Arrow should all', async () => {
  const a = constructTask((res) => {
    sleep(100).then(() => res(3))
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
      construct(() => (res, rej) => {
        const a = setTimeout(() => {
          i += 1
          rej('doh')
        }, 100)
        return () => {
          clearTimeout(a)
        }
      }),
      construct(() => (res) => {
        const a = setTimeout(() => {
          i += 1
          res(null)
        }, 10)
        return () => {
          clearTimeout(a)
        }
      }),
      construct(() => (res) => {
        const a = setTimeout(() => {
          i += 1
          res(null)
        }, 200)
        return () => {
          clearTimeout(a)
        }
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
      constructTask((res, rej) => {
        sleep(100).then(() => {
          i += 1
          return rej(null)
        })
      }),
      constructTask((res) => {
        sleep(10).then(() => {
          i += 1
          return res(null)
        })
      }),
      constructTask((res) => {
        sleep(200).then(() => {
          i += 1
          return res(null)
        })
      })
    ]
  )
    .runAsPromise({})
  expect(i).toEqual(2)
})

it('Arrow should all with concurrency limit', async () => {
  const a = constructTask((res) => {
    sleep(100).then(() => {
      res(3)
    })
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
      constructTask((res) => {
        sleep(300).then(() => {
          res(3)
        })
      }),
      constructTask((res) => {
        sleep(100).then(() => {
          res(1)
        })
      }),
      constructTask((res) => {
        sleep(600).then(() => {
          res(6)
        })
      })
    ]
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual(1)
  expect(p2 - p1 < 200).toBe(true)
})

it('Arrow should all concurrent - cancel on exception', async () => {
  let i = 0
  const result = await all(
    [
      constructTask((res, rej) => {
        setTimeout(() => {
          i += 1
          rej('boom')
        }, 100)
      }),
      constructTask((res) => {
        sleep(10).then(() => {
          i += 1
          res(null)
        })
      }),
      constructTask((res) => {
        sleep(200).then(() => {
          i += 1
          res(null)
        })
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
    constructTask((res) => {
      sleep(300).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(100).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(600).then(() => {
        res(3)
      })
    })
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3])
  expect(p2 - p1 < 1100).toBe(true)
  expect(p2 - p1 > 999).toBe(true)
})

it('Arrow should groupParallel', async () => {
  const p1 = performance.now()
  const result = await groupParallel(
    constructTask((res) => {
      sleep(300).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(100).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(100).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(100).then(() => {
        res(3)
      })
    }),
    constructTask((res) => {
      sleep(600).then(() => {
        res(3)
      })
    })
  )
    .runAsPromiseResult({})
  const p2 = performance.now()
  expect(result).toEqual([3, 3, 3, 3, 3])
  expect(p2 - p1 < 700).toBe(true)
  expect(p2 - p1 > 599).toBe(true)
})

it('constructed Arrow should cancel ongoing and subsequent operations and clean up', async () => {
  let flag = false
  const cancel = construct<{}, never, number>(() => (res) => {
    const a = setTimeout(() => {
      flag = true
      res(5)
    }, 500)
    return () => { clearTimeout(a) }
  }).map(b => b + 1)
    .run(
      {},
      () => {},
      () => {},
      () => {}
    )
  setTimeout(() => {
    cancel()
  }, 100)
  await sleep(1100)
  expect(flag).toEqual(false)
})

it('promise based Arrow should cancel subsequent operations', async () => {
  let flag = false
  let c = false
  const cancel = Arrow<{}, never, number>(async () => {
    await sleep(500)
    flag = true
    return Right(1)
  }).map(b => {
    c = true
    return b + 1
  })
    .run(
      {},
      () => {
        c = true
      },
      () => {},
      () => {}
    )
  setTimeout(() => {
    cancel()
  }, 100)
  await sleep(1100)
  expect(flag).toEqual(true)
  expect(c).toEqual(false)
})
