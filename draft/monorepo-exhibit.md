# Monorepo 项目展示数据获取方案

你原先的做法大概率是「按 GitHub 仓库列表 = 项目列表」。  
在 monorepo 下，`1 个仓库 = N 个包/子项目`，所以需要把“项目”从“repo 维度”改成“workspace package 维度”。

---

## 方案 1：前端直接读 GitHub `packages/*/package.json`（最少改造）

### 思路
- 用 GitHub API 先读取 `packages/` 目录，拿到子目录名。
- 再逐个读取 `packages/<name>/package.json`，提取 `name/version/description/keywords/homepage` 等字段。
- 在个人网页里把每个 package 当成一个项目卡片展示。

### 优点
- 不需要改仓库结构。
- 数据源就是 GitHub 主分支，天然实时。

### 缺点
- API 请求数会随包数量增加（容易碰 rate limit）。
- 前端直连 GitHub 需要处理 token 暴露、缓存、失败重试等问题。

### 适用
- 包数量不大（十几个到几十个）。
- 个人站点访问量不高。

---

## 方案 2：GitHub GraphQL 一次性拉树 + 元数据（请求更少）

### 思路
- 用 GraphQL 查询 `packages` 目录树（Tree entries）。
- 同时补充每个路径的最近提交时间/作者（`history(path:)`）。
- 客户端拿一份聚合结果渲染。

### 优点
- 请求次数比 REST 逐个文件低。
- 可以直接拿“最近活跃度”用于排序（例如最近更新优先）。

### 缺点
- GraphQL 查询写起来更复杂。
- 调试成本比 REST 稍高。

### 适用
- 你希望在页面上展示“最近更新”“贡献者”等信息。

---

## 方案 3：在仓库内预生成 `manifest.json`（最推荐）

### 思路
- 新增一个脚本扫描 `packages/*/package.json`，生成统一清单（例如 `public/monorepo-manifest.json`）。
- CI（GitHub Actions）在 push 时自动更新该文件。
- 个人网页只请求这一份 JSON，不直接打 GitHub API。

### 优点
- 前端实现最简单，性能最好。
- 不受 GitHub API rate limit 影响。
- 能加入你自定义字段（封面图、推荐级别、分类、演示链接）。

### 缺点
- 需要维护一个生成脚本 + CI。
- 数据不是“秒级实时”，而是“每次 push 后更新”。

### 适用
- 你想长期稳定维护展示页。
- 你希望未来继续扩展字段而不改前端抓取逻辑。

---

## 方案 4：GitHub + npm 双源聚合（展示效果最好）

### 思路
- 基础信息来自 monorepo（包名、描述、源码路径）。
- 发行信息来自 npm（最新版本、周下载量）。
- 合并后渲染：展示“源码活跃度 + 生态使用度”。

### 优点
- 用户能快速看懂“这个包有没有人在用”。
- 比只看 GitHub 更接近“项目影响力”。

### 缺点
- 数据链路更复杂。
- 非 npm 发布的包需要额外处理。

### 适用
- 你希望个人主页偏“作品集 + 影响力”风格。

---

## 方案 5：维护一个手写 `catalog`（展示可控度最高）

### 思路
- 新建 `projects.catalog.json`，手写每个包的标题、副标题、亮点、截图、优先级。
- 自动脚本只负责校验“catalog 中的 path 是否存在”。

### 优点
- 展示文案和视觉风格最可控。
- 不会受 package.json 字段质量影响。

### 缺点
- 需要人工维护。
- 容易和真实状态脱节（要加 CI 校验避免漂移）。

### 适用
- 你把主页当品牌页而非纯技术列表。

---

## 推荐落地（务实版）

建议采用：**方案 3（预生成 manifest）+ 方案 4（可选增强）**

1. 扫描 `packages/*/package.json` 生成基础清单（必做）。
2. 字段建议至少包含：
   - `name`
   - `path`
   - `description`
   - `description_zh`
   - `keywords`
   - `homepage`
   - `repository`
   - `version`
   - `lastCommitAt`（可从 git log 获取）
3. 页面只读取 `manifest.json`。
4. 有余力再异步补 npm 下载量，不阻塞首屏。

---

## 一个可直接使用的数据结构示例

```json
{
  "generatedAt": "2026-02-14T00:00:00.000Z",
  "repo": "baendlorel/lib",
  "packages": [
    {
      "name": "flat-pair",
      "path": "packages/flat-pair",
      "version": "1.3.2",
      "description": "Using array to save pairs...",
      "descriptionZh": "用数组来保存键值对...",
      "keywords": ["typescript", "javascript"],
      "homepage": "https://github.com/baendlorel/flat-pair#readme",
      "repository": "https://github.com/baendlorel/flat-pair",
      "lastCommitAt": "2026-02-10T12:34:56.000Z",
      "npm": {
        "name": "flat-pair",
        "version": "1.3.2",
        "downloads30d": 1234
      }
    }
  ]
}
```

---

## 额外建议（避免后续返工）

- 给每个 package 统一补齐字段：`description`、`description_zh`、`keywords`、`homepage`。
- 增加一个可选字段 `exhibit`（如 `featured`, `hidden`, `category`, `cover`），避免展示层硬编码。
- CI 增加校验：如果 `packages/*/package.json` 缺关键字段则提示。
- 未来若拆分子仓库，`manifest` 结构可以保持不变，前端无需大改。

