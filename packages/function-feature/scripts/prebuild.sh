#!/bin/bash

# 多版本预编译脚本
set -e  # 遇到错误立即退出

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 检查 nvm 是否可用
if ! command -v nvm &> /dev/null; then
    echo "Error: nvm is not available"
    exit 1
fi

# 记录当前版本
current_nvm=$(nvm current)
echo "Current node version: $current_nvm"

# 清理之前的预编译文件
rm -rf prebuilds/

NODE_VERSIONS=(16 18 20 22 24)

echo "Building for Node versions: ${NODE_VERSIONS[@]}"

# 检查并安装缺失的 Node 版本
for version in "${NODE_VERSIONS[@]}"; do
  if ! nvm list | grep -q "v$version"; then
    echo "Installing Node $version..."
    nvm install $version
  fi
done

for version in "${NODE_VERSIONS[@]}"; do
  echo "================================"
  echo "Building for Node $version"
  echo "================================"
  
  # 切换到指定版本
  nvm use $version
  if [ $? -ne 0 ]; then
    echo "Error: Failed to switch to Node $version"
    continue
  fi
  
  # 获取完整的版本号
  FULL_VERSION=$(node --version | sed 's/v//')
  echo "Using Node version: $FULL_VERSION"
  echo "Using npm version: $(npm --version)"
  
  # 清理并重新编译
  echo "Cleaning previous build..."
  npx node-gyp clean
  
  echo "Building native module..."
  npx node-gyp rebuild
  
  if [ $? -ne 0 ]; then
    echo "Error: Build failed for Node $version"
    continue
  fi
  
  # 使用 prebuildify 打包
  echo "Creating prebuild..."
  npx prebuildify --napi=false --strip --target node@$FULL_VERSION
  
  if [ $? -ne 0 ]; then
    echo "Error: Prebuildify failed for Node $version"
    continue
  fi
  
  echo "Successfully completed build for Node $version"
done

echo "================================"
echo "All builds completed!"
echo "Restoring to original Node version..."

# 恢复原来的版本
nvm use $current_nvm

echo "Prebuilt binaries saved in prebuilds/ directory"
if [ -d "prebuilds" ]; then
  ls -la prebuilds/
else
  echo "Warning: prebuilds directory not found"
fi

echo "Building Finished"
