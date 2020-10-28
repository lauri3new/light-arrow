/* eslint-disable no-await-in-loop */
import { Arrow } from '../index'

export const worker = (context: any) => async (iterator: IterableIterator<[number, Arrow<any, any, any>]>, context: any) => {
  const out = []
  let x: any
  for (const [index, item] of iterator) {
    x = await item.runAsPromiseResult(context)
    out.push(x)
  }
  return out
}
