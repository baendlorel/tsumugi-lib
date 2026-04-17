import { platform, arch } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
function loadNative() {
  // 优先尝试 build/Release
  try {
    return require('../build/Release/function_feature.node');
  } catch {
    // 自动查找 prebuilds 下的 ABI 文件
    const abi = process.versions.modules;
    const prebuildPath = join('..', 'prebuilds', `${platform()}-${arch()}`, `function-feature.abi${abi}.node`);
    return require(prebuildPath);
  }
}

const lib = loadNative();
export const getFeatures = lib.getFeatures;
export const getBound = lib.getBound;
export const getOrigin = lib.getOrigin;
export const getProxyConfig = lib.getProxyConfig;
export const setName = lib.setName;
export const protoToString = lib.protoToString;
export const isClass = lib.isClass;
