/* eslint-disable */
import { chain, fork, resolve } from 'fluture'
import { performance } from 'perf_hooks'

let b = resolve(1)

console.log('start', performance.now())
const sleep = () => new Promise((res) => setTimeout(() => { res() }, 1))
for (let i = 0; i < 5000; i++)
{
  b = chain((c: number) => resolve(c + 1))(b)
}

fork(
  (e) => {console.log(e)}
)(() => {
  console.log('p', performance.now())
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
})(b)