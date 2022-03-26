<div align="center">
<img height="100" src="https://raw.githubusercontent.com/lauri3new/light-arrow/master/arrow1.png">
<h1 >Light-Arrow</h1>
</div>

<p align="center">
<img alt="npm" src="https://img.shields.io/npm/v/@light-arrow/arrow?color=g">
<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/lauri3new/light-arrow/Node.js%20CI">
</p>

## About

Light Arrow is a small zero dependencies library for type safe asynchronous programming in typescript. The library is based around the functional and composable Arrow data type. Arrows are data structures that describe asynchronous (and synchronous) operations that can succeed or fail and may have some dependencies. Please check out the documentation https://lauri3new.github.io/light-arrow-docs/ for a longer explanation and some examples. 

For Arrow bindings for building type safe http apps using the express framework check out the `@light-arrow/express` module. Please see this section https://lauri3new.github.io/light-arrow-docs/docs/HttpApp of the documentation for more detail.

Inspiration from the highly recommended book *functional programming in scala* Manning, the scala libraries Cats, ZIO and http4s amongst others.

## Getting Started

Installation

```bash
npm install @light-arrow/arrow
```

### Arrows

Arrows are data structures that describe asynchronous operations that can succeed with a result value R or fail with a value E that depends on some dependencies D. Practically many programs or parts of programs we write fit that description. For those familiar to functional programming, Arrows are a kind of ReaderTaskEither. Arrows have a discoverable 'fluent' chain-able API, similar to native Promises and Arrays. To see a list of the full API of an Arrow check out the 'Methods' table at the bottom of this page.

```ts
Arrow<D, E, R>                                  
```

Arrows can be seen as useful wrappers around a function of type `(_:D) => Promise<Either<E, R>>`, that make working with such functions more convenient and providing lots of helper methods for composability. To convert existing data types to Arrows there are several `draw` functions provided that make this easier (see interoperability below). We can also `construct` Arrows as we would for promises using `new Promise`, also optionally specifying a 'tidy up' callback (e.g. to clear up timeouts). `constructTask` can be used when we require no dependencies in our created Arrow.

**The various ways of creating Arrows**
```ts
const a = construct((resolve, reject) => {
  const a setTimeout(() => {
    resolve(1)
  }, 1000)
  // we can return our tidy up function from construct
  return () => {
    clearTimeout(a)
  }
})

const b = resolve(1)

const c = Arrow(async ({ ok }: { ok: number }) => Right(5))
```
**Cancellation behaviour**
It's worth noting that Cancellation behaviour can vary based on how the arrow was created see the cancellation section below.

**An example function `sendEmail` returning an Arrow, depending on a promise based emailService**
```ts
type HasEmailService = {
  emailService: {
    send: (email: string) => Promise<void>
  }
}

const sendEmail = (email: string) => Arrow<HasEmailService, Error, string>(async ({ emailService }) => {
  try {
    await emailService.send(email)
    return Right('sent succesfully')
  } catch (e) {
    return Left(e)
  }
})
```

### Error handling

Typically errors are thrown from within promises to represent failure cases, however these are mixed with runtime errors. Neither of these types are tracked in the type signature. We have to inspect the particular promise to understand what errors may be thrown from it. Arrows use the [Either data type](Either.md) to enable centralised type safe error handling. By tracking the error type we can know from the type signature how our program might fail and cover all cases in the error handling function we pass to the run method (similiar to a catch at the end of a promise).

**Note**: in the examples below all of the types are inferred but are written out just for demonstration purposes.

```ts
const sendInvites: Arrow<{}, Error | string, void[]> = ...

sendInvites.run(
  {},
  () => console.log('success'),
  (error: string | Error) => {
    if (typeof error === 'string') {
      console.log('err str ', error)
    } else {
      console.log('err ', error.message)
    }
  }
)
```

### Referential transparency

Arrows won't actually perform any operation until the run method is called, this means that Arrows have the nice property of being referentially transparent. This means we can refactor expressions involving Arrows, such as calling a function returning an Arrow, and replacing them with the value returned without changing the meaning of the program. As it turns out by representing all side effects in our program, whether they are asynchronous or synchronous and failable or non-failable, as Arrows we can maintain referential transparency throughout our program making it easier to reason about.

Our program can compose to become one Arrow waiting to be executed through the run method, in which we provide dependencies and success, failure and exception handlers.

```ts
interface HasEmailService {
  emailService: {
    sendInvite: (email: string) => Arrow<{}, string, void>
  }
}

interface HasUserService {
  userService: {
    get: (id: number) => Arrow<{}, Error, User>
  }
}

const inviteUser = (id: number) => draw(({ userService }: HasUserService) => userService.get(id))
  .flatMap(({ email }) => draw(({ emailService }: HasEmailService) => emailService.sendInvite(email)))

const invites: Arrow<HasUserService & HasEmailService, Error | string, void[]> = sequence([
  inviteUser(1),
  inviteUser(2),
  inviteUser(3),
])
```

### Dependency injection

By delaying execution until the run method is called, Arrows provide a convenient type safe way to perform dependency injection as we can group all the dependencies of the program into a single object type and provide test and production implementations of these in the run method as we wish.

```ts
invites.runAsPromise({
  userService: mockUserService,
  emailService: mockEmailService
})

invites.runAsPromise({
  userService: productionUserService,
  emailService: productionEmailService
})
```

### Performance

Arrows are stack safe and perform similiarly to native promises under performance testing, but have all of the benefits listed above.

### Interoperability

There are a number of helper functions to convert existing types to Arrows, including basic values, functions, async functions. See these in the table Functions (create arrows from other types) below. Familiar helper functions such as `all` and `race` are provided as Arrow equivalents to `Promise.all` and `Promise.race`.

### Composability

Arrows are highly composable through their various methods listed below. The `orElse` and `andThen` methods are also provided as functions that accept n number of Arrows, `orElse` can be used for 'horizontal' composition, such as building up the routes of a express App. `andThen` can be used for 'vertical' composition, such as changing the context of a request for example in an authorisation middleware where the user making the requests details are added to the context for use by subsequent middlewares. Some more combinators are included such as `retry` and `repeat`.

### Cancellation

Arrows support cancellation. Cancellation behaviour can vary based on how the arrow was created, arrows created with `construct` when cancelled will cancel the ongoing operation and call the optionally specified tidy up function, its important to use `construct` over other ways of creating Arrows when this immediate cancellation is needed and/or if resources need to be tidied up (e.g. timeouts). Other arrows will complete the current operation but cancel the remaining operations.

