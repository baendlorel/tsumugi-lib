
// # from: tests/mocks/common.d.ts
// File with replace markers for testing replacement functionality
/*null*/ interface ReplaceableInterface {
  id: number;
  /*undefined*/ name: string;
}

/*null*/ type 42 = 'test' | 'prod';

/*null*/ declare const false: string;

// Some content that should not be replaced
export interface NormalInterface {
  value: boolean;
}
