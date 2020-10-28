import { Arrow } from '../index'

export const worker = (context: any) => async (iterator: IterableIterator<[number, Arrow<any, any, any>]>, context: any) => {
  let out = []
  let x: any
  for (let [index, item] of iterator) {
    x = await item.runAsPromiseResult(context)
    out.push(x)
  }
  return out
}
