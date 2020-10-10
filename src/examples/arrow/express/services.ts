import { draw } from '../../../arrow'
import { HasLogger } from './capabilities'
import { userModel } from './models'

export const userService = {
  get: (id: string) => draw(({ logger }: HasLogger) => userModel.get(id).map(a => {
    logger.info(['userService get', a])
    return a
  }))
}

export type HasUserService = {
  userService: typeof userService
}
