import { Arrow, combine, draw } from '../../../arrow'
import { Right } from '../../../either'
import { get, getHandler } from '../../../express/arrow'
import { BadRequest, Context, OK } from '../../../express/result'
import { authMiddleware } from './middleware'
import { HasUserService } from './services'

const validation = Arrow(async (a: Context) => Right({ ok: 123 }))

const ok = authMiddleware.merge(validation)

export const getUser = getHandler('/user', ok.flatMap(
  (v) => draw((a: Context & HasUserService) => a.userService.get('uo').map(() => OK({ hllo: 'world' })))
))

const getXhe = get('/xhe').map(() => OK({ xhe: 'xhe' }))

const router = combine(
  getUser,
  getXhe
)

export const getUserA = get('/usertwo').merge(ok).biMap(
  (a) => BadRequest({ doh: 'mate' }),
  (e) => OK({ allo: 'mate' })
).combine(getXhe)
