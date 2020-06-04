import { Arrow, fromFailableKP } from './arrow'
import { Context } from './express/result'

interface Email {
  send: () => Promise<any>
}

interface hasEmail {
  emailService: Email
}

interface Friend {
  get: () => Promise<any>
}

interface hasFriend {
  friendService: Friend
}

interface User {
  name: string
  id: string
}

const userServices = {
  get: <A extends hasEmail>(id: string) => fromFailableKP(async (ctx: A) => {
    ctx.emailService.send()
    return { name: 'yosdrgsdrg', id: 'fea' }
  })
}

const friendServices = {
  get: <A extends hasFriend>(name: string) => fromFailableKP(async (ctx: A) => {
    ctx.friendService.get()
    return { name: 'yo' }
  })
}

// if users name > 5 then get next friend

const getFriendAndEmail = <A extends hasEmail & hasFriend>(id: string) => userServices
  .get<A>(id)
  .flatMap((a) => {
    if (a.name.length > 5) {
      return friendServices.get(a.name)
    }
    return userServices.get(a.name)
  })
  .map((b) => b)

getFriendAndEmail('asef').runP({
  emailService: { send: () => Promise.resolve() },
  friendService: { get: () => Promise.resolve() }
})
