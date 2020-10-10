import { Arrow } from '../../../arrow'
import { Left, Right } from '../../../either'
import { Context, Result, Unauthorised } from '../../../express/result'

type Middleware<A extends Context, B extends A> = Arrow<A, Result, B>

export const authMiddleware: Middleware<Context, Context & { user: { name: string } }> = Arrow(
  async (a: Context) => (Math.random() > 0.5 ? Right({ ...a, user: { name: 'hello' } }) : Left(Unauthorised({})))
)

export const a = 123
