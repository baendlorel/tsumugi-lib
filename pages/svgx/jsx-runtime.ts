export function jsx(tag: string, props: Record<string, any> = {}): string {
  const children = (props.children ?? []) as any[];
  delete props.children;

  const attrs = props
    ? ' ' +
      Object.entries(props)
        .filter(([k, v]) => v !== null && v !== undefined && v !== false)
        .map(([k, v]) => `${k === 'className' ? 'class' : k}="${v}"`)
        .join(' ')
    : '';

  const inner = children
    .flat()
    .filter((v) => v !== null && v !== undefined && v !== false)
    .map(String)
    .join('');

  return `<${tag}${attrs}>${inner}</${tag}>`;
}

declare global {
  namespace JSX {
    type Element = string;
    interface IntrinsicElements {
      [elemName: string]: Record<string, any>;
    }
  }
}
