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
