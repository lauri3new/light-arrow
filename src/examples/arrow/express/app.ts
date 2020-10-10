import express from 'express'
import { bindApp, seal } from '../../../express/arrow'
import { InternalServerError, NotFound } from '../../../express/result'
import { capabilities } from './capabilities'
import { getUserA } from './routes'
import { userService } from './services'

const myApp = seal(getUserA,
  (e) => {
    console.log(e)
    return NotFound({ not: 'found' })
  },
  (e) => {
    console.log(e)
    return InternalServerError({ error: 'doh' })
  })

const app = express()

const x = bindApp(myApp, {
  ...capabilities,
  userService
})(app)

app.listen(8000)
