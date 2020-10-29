const { list, toArray, prepend } = require('@funkia/list')
const { Stack } = require('immutable')

let result = 1

const stack = toArray(list(
  { _tag: 'flatMap', f: [{ _tag: 'mapP', f: async a => a * 10 }, { _tag: 'mapP', f: async a => a + 4 }] },
  { _tag: 'map', f: a => a + 1 }
))

const a = prepend({ _tag: 'map', f: a => a + 1 }, list())
const b = prepend({ _tag: 'flatMap', f: [{ _tag: 'mapP', f: async a => a + 4 }, { _tag: 'mapP', f: async a => a * 10 }] }, a)
const stack2 = toArray(b)

let stack3 = Stack([
  { _tag: 'flatMap', f: [{ _tag: 'mapP', f: async a => a * 10 }, { _tag: 'mapP', f: async a => a + 4 }] },
  { _tag: 'map', f: a => a + 1 }
]).asMutable()


console.log(stack, stack2)
async function run() {
  do {
    const op = stack3.pop()
    if (op._tag === 'mapP') {
      // eslint-disable-next-line no-await-in-loop
      result = await op.f(result)
    } else if (op._tag === 'map') {
      result = op.f(result)
    } else if (op._tag === 'flatMap') {
      stack3.push(...(op.f))
    }
    console.log('helo')
  } while (stack3.length > 0)
  console.log(result)
}

run()
