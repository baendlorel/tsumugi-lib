import { CLI } from './common.js';

export async function help(): Promise<void> {
  console.log(`
江苏电信TokenHub API 密钥测试工具 v__VERSION__

用法:
  ${CLI}                             进入交互式测试（供人类使用）
  ${CLI} models <key>                列出所有可用模型名称，返回 JSON 对象（url + 模型数组）
  ${CLI} test <key> [--anthropic|--chat|--responses] [model_name]
                                  测试某个模型的某种回复，返回 JSON 对象
                                  （缺省接口标志时默认为 --chat）
环境变量:
TTC_MAX_OUTPUT_TOKENS   最大输出token数，默认为 300，设置过小可能被截断，导致响应异常。

示例:
  ${CLI} models sk-xxxxxx
  ${CLI} test sk-xxxxxx
  ${CLI} test sk-xxxxxx --chat
  ${CLI} test sk-xxxxxx --anthropic deepseek-v3
`);
}
