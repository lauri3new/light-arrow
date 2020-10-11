import { Arrow, combine } from '../../../arrow'
import { Right } from '../../../either'
import { get } from '../../../express/httpApp'
import { BadRequest, Context, OK } from '../../../express/result'
import { authMiddleware } from './middleware'

const validation = Arrow(async (a: Context) => Right({ ok: 123 }))

const ok = authMiddleware.merge(validation)
const getUser = get('/user').map(() => OK({ xhe: 'xhe' }))
const getXhe = get('/xhe').map(() => OK({ xhe: 'xhe' }))

const router = combine(
  getUser,
  getXhe
)

export const getUserA = get('/usertwo').merge(ok).biMap(
  (a) => BadRequest({ doh: 'mate' }),
  (e) => OK({ allo: 'mate' })
).combine(getXhe)

// .merge(ok).flatMap(
//   (v) => draw((a: Context & HasUserService) => a.userService.get('uo'))
// ).biMap(
//   () => BadRequest({ doh: 'mate' }),
//   () => OK({ allo: 'mate' })
// )
