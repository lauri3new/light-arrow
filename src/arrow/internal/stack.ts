class SNode<A> {
  val: A

  nextNode: SNode<A> | null = null

  constructor(val: A, nextNode?: SNode<A>) {
    this.val = val
    if (nextNode) {
      this.nextNode = nextNode
    }
  }

  bind(a: SNode<A>) {
    this.nextNode = a
  }

  next() {
    return this.nextNode
  }
}

export class Stack<A> {
  head: SNode<A> | null = null

  last: SNode<A> | null = null

  constructor(...val: A[]) {
    let nn
    const l = val.length
    for (let i = l - 1; i > -1; i += -1) {
      nn = new SNode(val[i])
      if (i === l - 1) this.last = nn
      nn.bind(this.head as SNode<A>)
      this.head = nn
    }
  }

  prepend(el: A) {
    const _this = this
    const nl = new Stack<A>()
    const head = new SNode(el, _this.head as SNode<A>)
    nl.head = head
    return nl
  }

  toArray() {
    const a = []
    let z = this.head
    do {
      a.push((z as SNode<A>).val)
      z = (z as SNode<A>).next()
    } while (z && (z as SNode<A>).next())
    // eslint-disable-next-line no-unused-expressions
    z && a.push((z as SNode<A>).val)
    return a
  }
}
