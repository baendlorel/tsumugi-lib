class H {
  tag: string;
  attr: Record<string, string>;
  children: H[] = [];
  constructor(tag: string, attr: Record<string, string> = {}, children: any[] = []) {
    this.tag = tag;
    this.attr = attr;
    this.children = children.map((c) => (c instanceof H ? c : new H(c)));
  }

  render(): string {
    const inner = this.children.map((c) => c.render()).join('');
    const attr = Object.entries(this.attr)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<${this.tag} ${attr}>${inner}</${this.tag}>`;
  }
}

export const h = (tag: string, attr: Record<string, string> = {}, children: any[] = []) => new H(tag, attr, children);
export const g = (attr: Record<string, string> = {}, children: any[] = []) => h('g', attr, children);
export const text = (attr: Record<string, string>, content: string) => h('text', attr, [content]);

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
