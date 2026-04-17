export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 记录当前 node 版本
current_node=$(node -v)
current_nvm=$(nvm current)

echo "Current node version: $current_node ($current_nvm)"

for v in 16 18 20 22 24; do
  nvm use $v
  node --test > "logs/$v.log"
  echo "Tested with Node $v"
done

# 恢复原来的 node 版本
echo "---"
echo "Restore to Node $current_nvm"
nvm use $current_nvm