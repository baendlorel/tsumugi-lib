
// # from: tests/mocks/common.d.ts
// File with replace markers for testing replacement functionality
/*ffff*/ interface ReplaceableInterface {
  id: number;
  /*__EXPORT_FLAG__*/ name: string;
}

/*ffff*/ type ReplaceableType = 'test' | 'prod';

/*ffff*/ declare const REPLACEABLE_CONST: string;

// Some content that should not be replaced
export interface NormalInterface {
  value: boolean;
}

// # from: tests/mocks/multi-file-1.d.ts
// multi-file-1.d.ts
export type Multi1 = number;

// # from: tests/mocks/multi-file-2.d.ts
// multi-file-2.d.ts
export type Multi2 = string;

// # from: tests/mocks/variables.d.ts
type ffff = 'test' | '__FLAG2__';

// Some content that should not be replaced
export interface NormalInterface {
  value: boolean;
}
