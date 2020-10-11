import { Arrow, draw, provideSome } from '../../arrow'
import { Right } from '../../either'

// capabilities

const dbClient = {
  query: () => 'ok'
}

type DbClient = typeof dbClient
type hasDbClient = {
  dbClient: DbClient
}

const logger = {
  log: (a: string) => console.log(a),
  error: (a: string) => console.error(a)
}

type Logger = typeof logger

type HasLogger = {
  logger: Logger
}

// low level services

const userModel = {
  save: (
    name: string
  ) => Arrow(async (_: hasDbClient) => Promise.resolve({ name }).then(Right))
}

type UserModel = typeof userModel

type HasUserModel = {
  userModel: UserModel
}

const capabilities = {
  logger
}

// services - business logic using capabilities

const userService = {
  create: (
    name: string
  ) => draw(({ userModel }: HasUserModel & HasLogger) => userModel.save(name))
}

const a = provideSome({ userModel })(userService.create('jim')).modifyD(async (b) => {
  console.log('modify', b)
  return Right(b)
})

a.provide({
  logger,
  dbClient
})
  .runAsPromise({})
  .then((a) => console.log('success', a))
  .catch((e) => console.log(e))

// complex services

// run
