/* eslint-disable no-await-in-loop */
import { Runner } from './runner'

export const worker = async (iterator: IterableIterator<[number, Runner]>, context: any) => {
  const out = []
  for (const [index, runner] of iterator) {
    const {
      hasError,
      error,
      failure,
      result
    } = await runner.run()
    if (hasError) {
      // eslint-disable-next-line no-throw-literal
      throw {
        tag: 'error',
        value: error
      }
    } else if (failure) {
      // eslint-disable-next-line no-throw-literal
      throw {
        tag: 'failure',
        value: failure
      }
    }
    out.push(result)
  }
  return out
}
