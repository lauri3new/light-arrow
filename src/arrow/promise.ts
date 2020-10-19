/* eslint-disable */
import { performance } from 'perf_hooks'

let b = Promise.resolve(1)

console.log('start', performance.now())
const sleep = () => new Promise((res) => setTimeout(() => { res() }, 1))
for (let i = 0; i < 5000; i++)
{
  b = b.then((b: number) => b + 1).then(async (b: number) => {
    // await sleep()
    return b + 1
  })
}

b.then(() => console.log('p', performance.now()))
.then(() => {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
})
