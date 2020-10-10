export type Capabilities = HasDbConnection & HasLogger

export type HasDbConnection = {
  dbConnection: {
    query: () => Promise<{
      name: string
      age: number
    }>
  }
}

export type HasLogger = {
  logger: {
    info: (_: any[]) => void
  }
}

export const capabilities: HasDbConnection & HasLogger = {
  logger: {
    info: (a: any[]) => console.log(...a)
  },
  dbConnection: {
    query: () => Promise.resolve({
      name: 'j',
      age: 30
    })
  }
}
