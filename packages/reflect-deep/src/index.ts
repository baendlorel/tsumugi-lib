import { ReflectDeep } from './deep.js';
import type { GroupedKey, ReachResult } from './deep.js';

export const deepGet = ReflectDeep.get;
export const deepSet = ReflectDeep.set;
export const deepHas = ReflectDeep.has;
export const deepDelete = ReflectDeep.deleteProperty;
export const deepReach: (target: object, propertyKeys: PropertyKey[], receiver?: any) => ReachResult = ReflectDeep.reach;
export const deepDefineProperty = ReflectDeep.defineProperty;
export const deepDeleteProperty = ReflectDeep.deleteProperty;
export const deepOwnKeys = ReflectDeep.ownKeys;
export const deepGroupedKeys: <T extends object>(target: T) => GroupedKey[] = ReflectDeep.groupedKeys;

export { ReflectDeep };
