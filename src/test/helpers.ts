export const sleep = (n: number) => new Promise((res) => setTimeout(() => { res() }, n))
