# DR 0 单游戏 Wiki 调研与模板优化总结

> 调研日期：2026-08-12  
> 项目：VV: ULTIMATUM 单游戏 Wiki 模板  
> 范围：近期上线或近期爆发的 Steam / Roblox 游戏；一个游戏一个独立域名；优先 `.wiki`、`游戏名wiki.*`、`游戏名.wiki`。

## 1. 调研口径

这次没有把 Fandom、wiki.gg、IGN、Game8、Steam Community 等老域名或聚合站当作视觉与 SEO 对标对象。筛选流程如下：

1. 从 SteamDB 2026 年 7 月新品/评分榜、Steam 新品页，以及 2026 年 7–8 月 Roblox 新晋体验资料中建立游戏池。
2. 用“`游戏名 wiki`”“`游戏名 guide`”“`游戏名 codes / tier list`”等玩家真实意图查询独立站。
3. 只保留一个域名服务一个游戏的站点。
4. 通过 Ahrefs Domain Rating 数据复核域名外链强度，重点保留 DR 0。
5. 对首页首屏、信息架构、内容模块、更新信号、工具能力和移动端思路做对比。

Ahrefs 对 DR 的定义是：根据外链域名数量与质量计算的 0–100 对数指标。DR 0 能说明域名几乎没有可见的外链权重，但不能单独证明排名完全由页面质量造成。这里更严谨的表述是：**这些站在低外链权重下，已经能在精确游戏 Wiki / 攻略查询中获得可见排名，页面与搜索意图匹配度是重要共同变量。**

参考：

- SteamDB 2026 年 7 月新品榜：https://steamdb.info/stats/gameratings/2026/?max_release=2026-07-31&min_release=2026-07-01
- SteamDB 2026 年 7 月发行日历：https://steamdb.info/calendar/2026-07/
- Ahrefs DR 说明：https://ahrefs.com/website-authority-checker
- Ahrefs 免费 DR API 文档：https://docs.ahrefs.com/en/api/reference/public/get-domain-rating-free
- DR 复核界面（数据来自 Ahrefs）：https://check-dr.com/

## 2. 本轮重点 DR 0 样本

搜索结果位置会因地区、时间和搜索引擎变化，表中的“可见情况”只表示 2026-08-12 本轮英文检索观察，不承诺固定名次。

| 游戏 / 平台 | 独立域名 | Ahrefs DR | 本轮检索可见情况 | 值得吸收的点 |
|---|---:|---:|---|---|
| The Mermaid Mask / Steam | https://themermaidmask.wiki/ | 0 | “The Mermaid Mask wiki guide”前排 | 首屏只讲一个核心任务；Walkthrough 与 Steam 双 CTA；发售日、好评率、成就数、语言数紧跟首屏 |
| The Ranchers / Steam | https://ranchers.wiki/ | 0 | “The Ranchers wiki guide”前排 | 视觉完全贴合田园游戏；发售状态明显；Guide / Animals 两条主路线；新闻与热修及时更新 |
| Beast of Reincarnation / Steam | https://beastofreincarnationwiki.wiki/ | 0 | “Beast of Reincarnation wiki guide”前排 | 精确 H1；平台、版本、价格、语言、战斗、角色模块覆盖完整；大量对比表和 FAQ |
| IRON NEST / Steam | https://iron-nest.wiki/ | 0 | 游戏 Wiki 查询中出现 | “Field Manual”定位贴合玩法；用武器、系统、区域、弹道等实体组织内容，而不是泛文章分类 |
| Endacopia / Steam | https://endacopiawiki.wiki/ | 0 | “Endacopia wiki guide”查询中出现 | Walkthrough、谜题、结局等意图分层清楚；适合剧情/解谜游戏的 spoiler-aware 内容结构 |
| Upgradex / Roblox | https://upgradex.wiki/ | 0 | “Upgradex Roblox wiki”前排 | 峰值 CCU、访问量、时长、评分可见；Points → Research → Prestige 路线图；Prestige 计算器形成非文章价值 |
| Build a Base and Steal / Roblox | https://build-a-base-and-steal.wiki/ | 0 | 游戏 Wiki 查询前排 | 首屏使用真实游戏图；访问量、人数、评分做事实芯片；地图、更新、事件、工具、对比页面直达 |
| Roblox Animal Hospital | https://robloxanimalhospitalwiki.wiki/ | 0 | Animal Hospital Wiki 查询中出现 | 按 Anomaly、Classes、Ending、Treatment 组织；“第一班怎么活”步骤化；多语言入口显眼 |
| Animal Hospital | https://animalhospitalwiki.com/ | 0 | Beginner Guide 长尾词可见 | 4 层检测法、异常数量、敌人数量、物品数量；答案结构比传统百科更贴近现场查找 |
| WEAPON DUELS / Roblox | https://weaponduels.wiki/ | 0 | 2026 年 7 月 Wiki 查询可见 | Codes、武器 Tier、Loadout、交易、Patch Notes 与工具集中在一个游戏域名内 |
| Final Swarm / Roblox | https://finalswarm.wiki/ | 0 | 2026 年 7 月攻略查询可见 | 明确给出新手阅读顺序：Beginner → Codes → Survival → Tier List → World |
| Paint and Seek / Roblox | https://paintandseek.online/ | 0 | 游戏代码/玩法长尾查询可见 | Codes、Perk Tier、Prop Tier、跨平台等意图拆分；日期直接进入标题与卡片 |

### 排除或降权的样本

以下站虽新，但不属于严格 DR 0，或域名平台本身已有明显积累，因此没有作为主要设计依据：

| 域名 | Ahrefs DR | 处理 |
|---|---:|---|
| endacopia.wiki | 4.6 | 只观察，不作为 DR 0 核心样本 |
| mistfall-hunter.wiki | 4.9 | 只观察 |
| animalhospitalroblox.wiki | 3.7 | 只观察 |
| anime-expeditions-wiki.wiki | 11 | 排除 |
| slimerng.wiki | 18 | 排除 |
| Fandom / wiki.gg / IGN / Game8 | 高权重平台 | 排除，不符合一个新游戏一个低权重域名的目标 |

## 3. DR 0 样本的共同优点

### 3.1 首屏先完成搜索意图，不先讲品牌故事

优秀样本首屏通常同时出现：

- 精确游戏名 + Wiki 的 H1；
- 一句话说明核心玩法与这个站解决的问题；
- 一个站内主动作，例如 Beginner Guide、Walkthrough、Guides；
- 一个官方外链动作，例如 Play on Roblox、Buy on Steam；
- 3–4 个可快速验证的事实，如发售日、平台、玩家数、成就数、评分或版本。

这能让搜索用户在不滚动的情况下确认“我来对地方了”。

### 3.2 首页按玩家任务，而不是按文章发布时间堆叠

低 DR 站普遍围绕游戏系统或玩家问题组织：

- 解谜游戏：Walkthrough、Puzzle、Clues、Ending、Achievements；
- 生存/模拟：Beginner、Crafting、Map、Items、Animals、Upgrades；
- Roblox：Codes、Tier List、Units/Weapons、Events、Progression、Tools；
- RPG：Builds、Bosses、Characters、Combat、Skills、Platforms。

分类名称本身就是搜索词，也是玩家在游戏中会说的词。

### 3.3 更新时间是内容的一部分

排名页面经常明确展示：

- `Last updated / Last verified`；
- 当前 patch / release 版本；
- 活跃与过期 codes 分开；
- 新闻/热修卡片按日期排序；
- 对尚未确认的信息使用 `Expected`、`TBA`、`community reports` 等限定。

对更新频繁的 Roblox 和 Early Access 游戏，这比单纯“文章很多”更重要。

### 3.4 工具与结构化数据比普通长文更有护城河

表现较好的独立站会提供：

- Prestige / 收益计算器；
- Anomaly Finder / Symptom Matcher；
- Tier List 对比表；
- 地图、路线、掉落表；
- Codes 一键复制与验证状态；
- 新手阅读顺序和跨页面下一步。

这些功能直接缩短玩家解决问题的时间，也更容易形成回访。

### 3.5 视觉主题服务单一游戏

共同做法不是堆特效，而是：

- 从游戏封面提取 1 个主色；
- 深色背景 + 高对比文本；
- 大标题、短描述、少量按钮；
- 首屏事实卡保持统一尺寸；
- 卡片图标与游戏系统一致；
- 游戏图像只出现在能提供上下文的位置。

The Ranchers 使用田园黄绿与衬线标题；The Mermaid Mask 使用深黑 + 青绿色；Beast of Reincarnation 使用黑金；Build a Base and Steal 使用真实 Roblox 画面 + 暗色遮罩。它们看起来像“这个游戏的站”，不是换了 Logo 的博客模板。

## 4. 原模板的主要不足

### 4.1 首页首屏层级不够直接

原版先显示标题，再放一个大视频，描述和入口靠后。用户看不到明确的 Beginner Guide / Play 按钮，也没有立刻可见的内容覆盖与版本事实。

### 4.2 首页保留 Wiki 文章侧栏，挤压了核心落地页

侧栏适合文章页，但首页应承担品牌、导航和搜索意图分流。原来桌面首页右侧固定 300px 侧栏，导致首屏主内容过窄。

### 4.3 自动横向轮播不利于可读性与控制

原“Trending”卡片自动滚动：

- 用户难以停留比较；
- 移动端可用性差；
- 对减少动态效果的用户不友好；
- 内容和链接会重复渲染一遍。

### 4.4 没有全站搜索

独立 Wiki 的核心任务是快速查答案。原模板只能通过顶部导航和侧栏逐级寻找，文章数量增长后效率会快速下降。

### 4.5 新鲜度与版本信号太弱

文章正文页没有统一显示发布日期、修改日期和“大版本后重新核验”的提醒。首页虽有日期，但不够突出，也没有把“最新修订”当作独立模块。

### 4.6 首页模块过长、重复

原首页把 8 个模块全部展开成大块，并再次展示热门内容、简介、FAQ、CTA。页面很长，但首屏到具体答案的距离并没有缩短。

### 4.7 默认社交分享图损坏

`public/images/hero.webp` 是 0 字节文件，但多个 Metadata / JSON-LD 默认引用它，可能导致 Open Graph、Twitter Card 和文章结构化图片失效。

### 4.8 仍偏“通用模板”，站点配置分散

游戏名、Roblox 地址、Discord、YouTube、站点 URL 和默认图片分散在多个文件中。换下一个游戏时容易漏改，不利于批量建立“一游戏一域名”的站点。

## 5. 本次已经完成的优化

### 首页

- 改为单游戏 Wiki 专属首屏：定位标签、精确 H1、简洁描述、Beginner Guide / Roblox 双 CTA。
- 增加内容数量、系统数量、语言和当前版本四个快速事实。
- 首页取消右侧 Wiki 文章侧栏，释放完整首屏宽度。
- 新增按游戏系统浏览的分类卡，并显示各分类文章数。
- 移除自动滚动轮播，改成固定的高意图攻略卡片网格。
- 将最新内容做成有日期的独立列表。
- 将新手步骤保留为清晰的 1–4 路线。
- 将原来 8 个展开模块收敛成 6 个关联路线卡片，减少重复和页面长度。
- 保留 About、数据事实、FAQ 和最终 CTA，继续覆盖实体与常见问题意图。

### 功能

- 新增全站搜索弹窗，可搜索标题、描述和内容类型。
- 支持 `⌘/Ctrl + K` 和 `/` 快捷键。
- 搜索结果直接显示内容类型，并支持移动端紧凑入口。
- 桌面导航断点调整到 `xl`，避免中等宽度下导航拥挤。

### 文章页

- 新增分类 Badge。
- 新增 Published / Updated 信息条。
- 新增大版本后重新核验的透明提醒。
- 表格增加横向滚动与最小宽度，移动端不再被硬挤压。

### 视觉与技术

- 深色主题改为更接近游戏 Wiki 的墨黑蓝 + 暖橙主题。
- 增加细微网格背景、统一 focus 样式和文本 selection 样式。
- 修复所有默认 `hero.webp` 引用，改为有效的 `hero-trailer-thumbnail.jpg`。
- 保留 Trailer 点击后加载 YouTube 的方式，避免首屏直接嵌入视频播放器。
- 修复 App Router 根布局缺失 `<html>` / `<body>` 导致的运行时错误。
- 修复静态导出下英语内容页链接缺少 `/en` 前缀而产生的 404；根首页仍保留在 `/`。
- 搜索支持按 Enter 打开首个结果，并补齐日语搜索文案。
- 390px 移动端把语言切换移入菜单，消除页头横向溢出和页面横向滚动条。

## 6. 优化后仍然存在的不足

这些问题不应掩盖，建议作为下一阶段清单：

1. **站点配置尚未完全中心化。** 应建立单一 `site.config.ts`，集中游戏名、短名、域名、平台链接、社交链接、主色和默认图。
2. **多数 MDX 没有 `lastModified`、作者、来源与游戏版本字段。** 目前缺少时会回退到 `date`，但这不等于真实复核时间。
3. **Active Codes 仍有硬编码。** 应移到结构化 JSON，并包含 `verifiedAt`、`status`、`reward`、`source`。
4. **还没有游戏专属工具。** 对 VV: ULTIMATUM 最值得做的是 Build Planner、Race/Skill 比较器、Boss 掉落筛选和 Codes 一键复制。
5. **搜索适合当前文章量，不适合数百页。** 现在所有搜索数据随 Header 下发；内容超过约 300–500 篇后应改为构建期索引或按需搜索。
6. **图片资产仍不足。** 当前有效主视觉主要来自 trailer thumbnail；不同分类缺少 Boss、Race、Map、Skill 的真实游戏截图。
7. **部分内容链接和分类规划仍有历史遗留。** Footer 的 Build Guide 等链接需要在换游戏时自动从真实内容生成，避免 404。
8. **日文内容需要持续人工校对。** 模板可正常以 UTF-8 读取，但术语、版本和事实仍应随英文主内容同步复核。
9. **DR 0 不等于长期稳定排名。** 新游戏窗口竞争较小，页面需要在补丁发布后快速更新，并通过真实工具、数据与来源提高持续价值。

## 7. 下一阶段优先级

### P0：上线前必须做

- 为每篇核心文章补 `lastModified`、`gameVersion`、`sources`。
- 检查全部 Footer / 首页 CTA 是否真实存在。
- 补齐有效 OG 图与分类图。
- 把 codes 从硬编码改为结构化数据。

### P1：提升页面质量

- 增加 Codes 一键复制与最后验证时间。
- 增加 Boss / Skill / Race 可过滤对比表。
- 增加 Build Planner，形成区别于普通文章站的核心工具。
- 在更新日志中建立“本补丁影响了哪些攻略”的反向链接。

### P2：模板化扩展

- 站点配置中心化。
- 自动生成内容覆盖统计、最后更新时间和导航。
- 支持按游戏主题配置字体、颜色、Logo、Hero 图与分类图标。
- 为新游戏提供内容启动清单：Home、Beginner、Codes、Tier、Controls、FAQ、Updates、2–3 个游戏专属实体页。

## 8. Sephiria.net 样式与页面质量案例

本轮进一步检查了 `https://sephiria.net/` 的首页、Builds、Weapons 和 Secret Rooms 页面。这个案例的价值不只是长尾覆盖，而是它把游戏化视觉、搜索意图、证据和交互做成了同一套系统。

### 8.1 值得吸收的视觉系统

- 森林黑绿底、旧金色强调、米金标题和薄荷绿状态色形成稳定的游戏识别。
- Metamorphous / Cormorant Garamond 类展示字体只用于标题和主要动作，正文继续使用 Inter，兼顾氛围和长文可读性。
- 桌面端两层导航把 Beginner、Weapons、Builds、Characters 等主题页与 Secret Rooms、Co-op、Elru 等长尾入口分开。
- 圆角很克制，普通内容卡片接近 4–12px；胶囊形状主要留给 CTA、状态和筛选器。
- 背景使用极低对比度网格、光晕和轨道装饰，不依赖大面积特效抢夺内容注意力。
- 首页不是文章流，而是用户问题地图；每张卡片包含场景标签、可解决的问题和明确动作。

### 8.2 延长有效访问时间的页面能力

- Builds 页提供 Quick Answer、Patch Status、证据标签、热门配置、玩法筛选、Preset 一键复制、视频时间点和配置是否仍可用的反馈。
- Weapons 页把六种武器概览、交互探索器、玩法推荐、Tier、解锁、升级路线、版本变化、FAQ 和来源放在一个完整意图页中。
- Secret Rooms 页提供 Before / After 图片对比、按楼层示例、精确路线视频、奖励和“是否成功找到”的反馈。
- 首页与文章结尾持续提供“当前问题解决后该看什么”，减少用户返回搜索结果页重新选择的需要。
- Last Reviewed、游戏版本、官方/社区证据和 Editorial Policy 被设计成可见页面元素，而不是藏在页脚声明中。

用户提供的截图显示跳出率约 39%、平均访问时间超过 3 分钟，且 Builds、Weapons、Wiki 等查询具有很高 CTR。它们与当前页面结构相符，但不能据此断言 Google 直接使用 Analytics 或 Similarweb 的跳出率和访问时长排序。更稳妥的判断是：页面更完整地满足搜索意图后，站内浏览、回访、分享和主题覆盖共同改善，随后长尾与主词表现一起增长。

### 8.3 已应用到当前模板

- 保留 VV 自身的墨黑、暖橙和战斗感，不复制 Sephiria 的森林绿色。
- 新增 Cormorant Garamond 展示字体，用于 Logo、H1、H2、卡片标题和数据值；正文继续使用 Inter。
- 桌面页头改成“品牌/搜索/Play”主栏与“核心攻略/游戏系统”导航栏两层结构。
- 删除不存在的 Updates 入口，修正 Footer 中不存在的 `/builds` 链接。
- 首屏加入低对比轨道纹理、克制的金橙边框、主次 CTA 和更清晰的事实条。
- 首页新增“What this wiki covers”与内容核验说明。
- 分类卡片从“图标 + 分类名”升级为“玩家场景 + 分类名 + 可解决的问题 + 文章数 + 动作”。
- 首页和文章卡片统一使用更小圆角、更低对比渐变和更克制阴影。
- 文章页新增 Quick Answer，并把 Published / Last Reviewed / Patch 提醒整合为 Review Record。
- 相关文章模块改为“Choose your next move”，明确当前答案之后的阅读路径。
- MDX H2/H3、表格和引用块接入同一展示字体与视觉规则。

参考页面：

- 首页：https://sephiria.net/
- Builds：https://sephiria.net/builds/
- Weapons：https://sephiria.net/weapons/
- Secret Rooms：https://sephiria.net/guides/secret-rooms/

## 9. 结论

DR 0 新站能获得排名时，优势通常不是“页面做得花”，而是四件事同时成立：

1. 域名、Title、H1 与单一游戏实体高度一致；
2. 首屏立刻满足 Wiki / Guide 查询意图；
3. 页面围绕真实游戏系统和下一步决策组织；
4. 更新日期、版本、来源和工具让内容比普通长文更可信、更快用。

本次模板优化已经把首页和文章页向这四点靠拢。下一步最能继续拉开差距的不是再加卡片，而是补齐 **结构化版本数据、可验证来源和游戏专属工具**。
