import { performance } from 'perf_hooks'
import { sArrow } from '../arrow/stacksafe'
import { Right } from '../either'

it('should not stack overflow', async () => {
  let a = sArrow<{}, never, number>(async () => Right(1))
  for (let i = 0; i < 100000; i += 1) {
    a = a.map((c: number) => c + 1)
  }
  const result = await a.runAsPromiseResult({})
  expect(result).toEqual(100001)
})

it('should flatMap close to speed of promises', async () => {
  const p1 = performance.now()
  let a = sArrow<{}, never, number>(async () => Right(1))
  for (let i = 0; i < 1000000; i += 1) {
    a = a.flatMap((c: number) => sArrow<{}, never, number>(async () => Right(c + 1)))
  }
  await a.runAsPromise({})
  const p2 = performance.now()
  const p3 = performance.now()
  let b = Promise.resolve(1)
  for (let i = 0; i < 1000000; i += 1) {
    b = b.then(async (c: number) => c + 1)
  }
  await a.runAsPromise({})
  const p4 = performance.now()
  const promiseRunTime = p4 - p3
  const arrowRunTime = p2 - p1
  expect(arrowRunTime).toBeLessThan(promiseRunTime * 1.25)
})

it('should map close to speed of promises', async () => {
  const p1 = performance.now()
  let a = sArrow<{}, never, number>(async () => Right(1))
  for (let i = 0; i < 1000000; i += 1) {
    a = a.map((c: number) => c + 1)
  }
  await a.runAsPromise({})
  const p2 = performance.now()
  const p3 = performance.now()
  let b = Promise.resolve(1)
  for (let i = 0; i < 1000000; i += 1) {
    b = b.then((c: number) => c + 1)
  }
  await a.runAsPromise({})
  const p4 = performance.now()
  const promiseRunTime = p4 - p3
  const arrowRunTime = p2 - p1
  expect(arrowRunTime).toBeLessThan(promiseRunTime * 1.20)
})
