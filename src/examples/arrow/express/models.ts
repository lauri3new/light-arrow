
import { drawAsync } from '../../../arrow'
import { Right } from '../../../either'
import { HasDbConnection } from './capabilities'

export const userModel = {
  get: (id: string) => drawAsync(({ dbConnection }: HasDbConnection) => dbConnection.query().then(Right).catch(e => console.log(e)))
}

export const aModel = {

}
