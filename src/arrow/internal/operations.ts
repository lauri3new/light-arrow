import { Either } from '../../either/index'
import { Arrow } from '../index'

export enum Ops {
  map = 1,
  flatMap = 2,
  leftMap = 3,
  andThen = 4,
  orElse = 5,
  group = 6,
  groupFirst = 7,
  groupSecond = 8,
  init = 9,
  all = 10,
  race = 11,
  bracket = 12,
  initValue = 13
}

type map = {
  _tag: Ops.map
  f: (result: any) => any
}

type leftMap = {
  _tag: Ops.leftMap
  f: (error: any) => any
}

type orElse = {
  _tag: Ops.orElse
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type andThen = {
  _tag: Ops.andThen
  f: Arrow<any, any, any> | ((result: any) => Promise<Either<any, any>>)
}

type group = {
  _tag: Ops.group
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type groupFirst = {
  _tag: Ops.groupFirst
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type groupSecond = {
  _tag: Ops.groupSecond
  f: Arrow<any, any, any> | ((context: any) => Promise<Either<any, any>>)
}

type flatMap = {
  _tag: Ops.flatMap
  f: (result: any) => Arrow<any, any, any> | ((result: any) => (context: any) => Promise<Either<any, any>>)
}

type init = {
  _tag: Ops.init
  f: (context: any) => Promise<Either<any, any>>
}

type all = {
  _tag: Ops.all
  f: Arrow<any, any, any>[]
  concurrencyLimit?: number
}

type race = {
  _tag: Ops.race
  f: Arrow<any, any, any>[]
}

type bracket = {
  _tag: Ops.bracket
  f: [(_:any) => Arrow<any, any, any>, (_:any) => Arrow<any, any, any>]
}

type initValue = {
  _tag: Ops.initValue
  f: any
}

export type Operation = map | leftMap | flatMap | orElse | group | andThen | groupFirst | groupSecond | init | all | race | bracket | initValue
