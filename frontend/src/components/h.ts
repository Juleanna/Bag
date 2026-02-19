export type ElementProps = Record<string, any>

const INTERNAL_PROPS = new Set([
  'children', 'variant', 'options', 'columns', 'active', 'isOpen',
])

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  for (const [k, v] of Object.entries(props)) {
    if (INTERNAL_PROPS.has(k)) continue
    if (k === 'class') {
      el.className = v
    } else if (k.startsWith('on') && typeof v === 'function') {
      const eventName = k.substring(2).toLowerCase()
      el.addEventListener(eventName, v)
    } else if (v != null && v !== false) {
      el.setAttribute(k, String(v))
    }
  }

  for (const c of children) {
    if (c == null) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }

  return el
}
