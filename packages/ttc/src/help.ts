export function showHelp(): void {
  console.log(`
江苏电信TokenHub API 密钥测试工具

用法:
  ttc                             进入交互式测试（供人类使用）
  ttc models <key>                列出所有可用模型名称，返回 JSON 对象（url + 模型数组）
  ttc test <key> [--anthropic|--chat|--response] [model_name]
                                  测试某个模型的某种回复，返回 JSON 对象
                                  （缺省接口标志时默认为 --chat）

接口标志:
  --anthropic   Anthropic Messages (/v1/messages)
  --chat        Chat Completions (/v1/chat/completions)
  --response    Responses (/v1/responses)

测试返回的 JSON 字段:
  key     测试用的 API Key
  model   测试用的模型
  content 返回的内容
  valid   是否有效 (boolean)
  url     访问的接口地址

示例:
  ttc models sk-xxxxxx
  ttc test sk-xxxxxx
  ttc test sk-xxxxxx --chat
  ttc test sk-xxxxxx --anthropic deepseek-v3
`);
}
