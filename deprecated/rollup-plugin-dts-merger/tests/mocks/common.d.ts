// File with replace markers for testing replacement functionality
/*__FLAG__*/ interface ReplaceableInterface {
  id: number;
  /*__EXPORT_FLAG__*/ name: string;
}

/*__FLAG__*/ type ReplaceableType = 'test' | 'prod';

/*__FLAG__*/ declare const REPLACEABLE_CONST: string;

// Some content that should not be replaced
export interface NormalInterface {
  value: boolean;
}
