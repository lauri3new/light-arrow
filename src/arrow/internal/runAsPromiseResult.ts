import { Runner } from './runner'

export async function runAsPromiseResult(a: Runner) {
  const {
    hasError,
    error,
    failure,
    result
  } = await a.run()
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
  return result
}
