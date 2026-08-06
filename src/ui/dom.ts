type Attrs = Record<string, string | number | boolean>

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) {
    if (value === false) {
      continue
    }
    node.setAttribute(name, value === true ? '' : String(value))
  }
  node.append(...children)
  return node
}

export function clear(node: HTMLElement): void {
  node.replaceChildren()
}
