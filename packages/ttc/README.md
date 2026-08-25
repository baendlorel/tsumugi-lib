# ttc

测试你的 TokenHub / 电信大模型网关 API Key 是否有效的命令行工具。

## 用法

```bash
# 交互式测试（无参数，供人类使用）
ttc

# 列出所有可用模型名称，返回 JSON 对象（url + 模型数组）
ttc models <key>

# 测试某个模型在某个接口下的回复是否有效，返回 JSON 对象
# 缺省接口标志时默认为 --chat
ttc test <key> [--anthropic|--chat|--response] [model_name]
```

## 命令说明

### `ttc`

不带任何参数时进入交互式流程：输入 API Key → 获取模型列表 → 选择模型 → 并行测试三种接口并展示结果。

### `ttc models <key>`

列出 `<key>` 可用的所有模型名称，输出 JSON 对象（含接口地址和模型数组）：

```json
{
  "url": "https://aigw.telecomjs.com/v1/models",
  "models": ["deepseek-v3", "gpt-4o-mini", "glm-4.5"]
}
```

### `ttc test <key> [--anthropic|--chat|--response] [model_name]`

测试某个模型在某一种接口下的回复是否有效，输出 JSON 对象：

```json
{
  "key": "sk-xxxxxx",
  "model": "deepseek-v3",
  "content": "你好，我是……",
  "valid": true,
  "url": "https://aigw.telecomjs.com/v1/chat/completions"
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `key` | string | 本次使用的 API Key |
| `model` | string | 测试用的模型；省略 `model_name` 时默认取可用模型列表的第一个 |
| `content` | string | 返回的内容（失败时为空字符串） |
| `valid` | boolean | 是否有效 |
| `url` | string | 访问的接口地址 |

接口标志：

- `--anthropic`：Anthropic Messages（`/v1/messages`）
- `--chat`：Chat Completions（`/v1/chat/completions`）
- `--response`：Responses（`/v1/responses`）

> 缺省时默认为 `--chat`；不写接口标志时第二个参数为 `model_name`（如 `ttc test sk-xxx deepseek-v3`）。
> 传入非法接口标志（如 `--xxx`）会返回 `{"error":"应该使用 --anthropic | --chat | --response"}`。

## License

MIT
