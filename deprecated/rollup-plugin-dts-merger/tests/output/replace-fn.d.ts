
// # from: tests/mocks/common.d.ts
// File with replace markers for testing replacement functionality
/*__FLAG___fn_fn*/ interface ReplaceableInterface {
  id: number;
  /*__EXPORT_FLAG__*/ name: string;
}

/*__FLAG___fn_fn*/ type ReplaceableType = 'test' | 'prod';

/*__FLAG___fn_fn*/ declare const REPLACEABLE_CONST: string;

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
type __FLAG___fn_fn = 'test' | '__FLAG2__';

// Some content that should not be replaced
export interface NormalInterface {
  value: boolean;
}
