# ttc

[![npm version](https://img.shields.io/npm/v/telecomjs-tokenhub-checker.svg)](https://www.npmjs.com/package/telecomjs-tokenhub-checker) [![npm downloads](http://img.shields.io/npm/dm/telecomjs-tokenhub-checker.svg)](https://npmcharts.com/compare/telecomjs-tokenhub-checker,token-types?start=1200&interval=30)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/59dd6795e61949fb97066ca52e6097ef)](https://www.codacy.com/app/Borewit/telecomjs-tokenhub-checker?utm_source=github.com&utm_medium=referral&utm_content=Borewit/telecomjs-tokenhub-checker&utm_campaign=Badge_Grade)

**TokenHub Checker** — 测试 TokenHub / 电信大模型网关 API Key 是否有效的命令行工具。

## 安装

```bash
npm install -g telecomjs-tokenhub-checker
```

## 用法

### 交互式测试

```bash
ttc
```

无参数时进入交互式流程：输入 API Key → 自动获取可用模型列表 → 选择模型 → 并行测试三种接口（chat、responses、anthropic）。

输出示例：

```text
[chat] ✅ 我是一个乐于助人的AI
📦 [chat] Token 用量: completion_tokens: 50, prompt_tokens: 40, total_tokens: 90

[responses] ✅ 我是一个乐于助人、随时响应的AI助手。
📦 [responses] Token 用量: input_tokens: 35, output_tokens: 62, total_tokens: 97

[anthropic] ❌ 响应格式异常：缺少 content 字段
📄 [anthropic] 原始响应: {"type":"message","role":"assistant"}

──────────────────────────────────────────────────
✅ 可用: [chat]、[responses]
❌ 不可用: [anthropic]
```

- 每个接口占一个区块，区块之间用空行分隔。
- 正常返回的接口在标签后带 ✅，失败的带 ❌ 并给出原因。
- Token 用量行同样带 `[接口名]` 前缀，嵌套字段（如 `prompt_tokens_details`）展开为 `a.b: c`，不会出现 `[object Object]`。
- 响应格式异常时，会额外打印完整原始响应，便于判断是网关透传问题还是解析问题。
- 最后一行给出结论：哪些接口可用、哪些不可用。

### 列出可用模型

```bash
ttc models <key>
```

输出 JSON 对象：

```json
{
  "url": "https://aigw.telecomjs.com/v1/models",
  "models": ["deepseek-v3", "gpt-4o-mini", "glm-4.5"],
  "version": "0.1.7"
}
```

### 测试单接口

```bash
ttc test <key> [--chat | --anthropic | --responses] <model_name>
```

测试某个模型在指定接口下的回复是否正常，输出 JSON 对象：

```json
{
  "key": "sk-xxxxxx",
  "model": "deepseek-v3",
  "type": "chat",
  "valid": true,
  "content": "我是……",
  "elapsed": 123.456,
  "url": "https://aigw.telecomjs.com/v1/chat/completions",
  "version": "0.1.7"
}
```

**参数说明**

| 参数         | 说明                          |
| ------------ | ----------------------------- |
| `key`        | API Key（必填）               |
| `model_name` | 模型名称（必填）              |
| `--flag`     | 接口类型标志，默认为 `--chat` |

**接口标志**

| 标志             | 接口               | 端点                   |
| ---------------- | ------------------ | ---------------------- |
| `--chat`（默认） | Chat Completions   | `/v1/chat/completions` |
| `--responses`    | Responses          | `/v1/responses`        |
| `--anthropic`    | Anthropic Messages | `/v1/messages`         |

> 标志和 `model_name` 顺序可互换：`ttc test sk-xxx deepseek-v3 --anthropic` 等效于 `ttc test sk-xxx --anthropic deepseek-v3`。
> 如果只传一个位置参数（无标志），该参数视为 `model_name`，接口默认为 `--chat`。

**输出字段**

| 字段      | 类型    | 说明                                              |
| --------- | ------- | ------------------------------------------------- |
| `key`     | string  | 本次使用的 API Key                                |
| `model`   | string  | 测试的模型名称                                    |
| `type`    | string  | 接口类型（`chat` / `responses` / `anthropic`）    |
| `valid`   | boolean | 请求是否成功且返回了有效内容                      |
| `content` | string  | 模型返回的内容（失败时为空字符串）                |
| `error`   | string  | 仅在失败时出现，描述错误原因                      |
| `raw`     | any     | 仅在失败时出现，服务端返回的原始响应              |
| `elapsed` | number  | 请求耗时（毫秒，如 `123.456`）                    |
| `url`     | string  | 实际请求的接口地址                                |
| `version` | string  | CLI 版本号                                        |

> `usage` 字段在单接口测试的输出中被移除，仅在交互模式的日志中展示。

## 环境变量

| 变量                     | 默认值                                | 说明                                       |
| ------------------------ | ------------------------------------- | ------------------------------------------ |
| `TTC_MAX_OUTPUT_TOKENS`  | `300`                                 | responses 接口的最大输出 token 数          |
| `TTC_BASE_URL`           | `https://aigw.telecomjs.com/v1`       | 网关地址，便于指向自建/代理端点            |

## 协议透传说明

电信大模型网关对三种接口均为透传。如果源供应商没有对应的接口（例如某些模型不支持 `/responses` 或 `/messages`），返回失败是正常现象。

请求超时为 60 秒，超时按失败处理，不会无限挂起。

## License

MIT
