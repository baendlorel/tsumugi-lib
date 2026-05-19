type Child = string | number | boolean | null | undefined | Child[];
type Props = Record<string, unknown> & { children?: Child };

const escapeXml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const renderChildren = (value: Child): string => {
  if (value == null || value === false) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(renderChildren).join('');
  }

  return String(value);
};

const renderProps = (props: Record<string, unknown>) => {
  const entries = Object.entries(props)
    .filter(([, value]) => value !== null && value !== undefined && value !== false)
    .map(([key, value]) => {
      const attrName = key === 'className' ? 'class' : key;
      if (value === true) {
        return attrName;
      }

      return `${attrName}="${escapeXml(value as string | number)}"`;
    });

  return entries.length > 0 ? ` ${entries.join(' ')}` : '';
};

export const Fragment = (props: { children?: Child }) => renderChildren(props.children);

export function jsx(tag: string | ((props: Props) => string), props: Props = {}): string {
  const { children, ...restProps } = props;

  if (typeof tag === 'function') {
    return tag(props);
  }

  const attrs = renderProps(restProps);
  const inner = renderChildren(children);
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

export const jsxs = jsx;

declare global {
  namespace JSX {
    type Element = string;
    interface IntrinsicElements {
      [elemName: string]: Record<string, any>;
    }
  }
}
