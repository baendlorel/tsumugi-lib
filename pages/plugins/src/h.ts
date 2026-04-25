type HChild = H | string | number | null | undefined | HChild[];

const escapeXml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const normalizeChildren = (children: HChild[]): Array<H | string> => {
  const normalized: Array<H | string> = [];

  for (const child of children) {
    if (child == null) {
      continue;
    }

    if (Array.isArray(child)) {
      normalized.push(...normalizeChildren(child));
      continue;
    }

    if (child instanceof H) {
      normalized.push(child);
      continue;
    }

    normalized.push(String(child));
  }

  return normalized;
};

class H {
  tag: string;
  attr: Record<string, string>;
  children: Array<H | string> = [];
  constructor(tag: string, attr: Record<string, string> = {}, children: HChild[] = []) {
    this.tag = tag;
    this.attr = attr;
    this.children = normalizeChildren(children);
  }

  render(): string {
    const inner = this.children.map((c) => (typeof c === 'string' ? escapeXml(c) : c.render())).join('');
    const attr = Object.entries(this.attr)
      .map(([key, value]) => `${key}="${escapeXml(value)}"`)
      .join(' ');
    const attrText = attr ? ` ${attr}` : '';
    return `<${this.tag}${attrText}>${inner}</${this.tag}>`;
  }
}

export const h = (tag: string, attr: Record<any, any> = {}, children: HChild[] = []) => new H(tag, attr, children);
export const g = (attr: Record<any, any> = {}, children: HChild[] = []) => new H('g', attr, children);
export const text = (attr: Record<any, any>, content: string) => new H('text', attr, [content]);

export const measureTextWidth = (text: string, fontSize: number) => {
  let units = 0;
  for (const char of text) {
    if (char === ' ') {
      units += 0.32;
    } else if (/[-_/.:]/.test(char)) {
      units += 0.42;
    } else if (/[A-Z0-9]/.test(char)) {
      units += 0.66;
    } else if (/[a-z]/.test(char)) {
      units += 0.58;
    } else if (/[,;!?()]/.test(char)) {
      units += 0.38;
    } else {
      units += 1;
    }
  }
  return units * fontSize;
};

const pad = (value: number) => String(value).padStart(2, '0');
export const dtm = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}.${month}.${day}-${hour}.${minute}.${second}`;
};
