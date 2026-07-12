interface ListFrame {
  counter: number
  ordered: boolean
}

export function createListState() {
  const stack: ListFrame[] = []

  function enter(ordered: boolean, start: number | ``): void {
    stack.push({ ordered, counter: Number(start) })
  }

  function exit(): void {
    stack.pop()
  }

  function reset(): void {
    stack.length = 0
  }

  function nextPrefix(): string {
    const frame = stack[stack.length - 1]
    if (!frame)
      return `• `

    const current = frame.counter
    frame.counter = current + 1

    return frame.ordered
      ? `${current}. `
      : `• `
  }

  return {
    enter,
    exit,
    nextPrefix,
    reset,
  }
}
