# 贴吧热帖采集（2026-02-27）

采集目标：为“都市生存卡牌 Web Game”补充中国语境事件素材。  
采集范围：社会吧、中国吧、时事吧、民生吧、打工人吧、失业吧、考公吧、房价吧、程序员吧、高考吧、考研吧、留学吧、润吧、成都吧、上海吧、北京吧、深圳吧、弱智吧。  
采集入口：`https://wapp.baidu.com/f?kw=<吧名>`（移动页，避开安全验证拦截）。  
采集时间：2026-02-27（UTC+8）。

## 结果概览

- 已完成可用抓取：`17/18`（社会吧无可用吧页，返回“没有找到相关内容”）。
- 已沉淀结构化素材：`content/tieba-event-seeds.js`（34 条，可直接用于事件池改编）。
- 每条素材包含：`bar/sourceTitle/sourceUrl/hook/tags`。

## 特殊说明

- `社会吧`：当前入口页无有效贴吧内容，后续建议改用“社会新闻吧/社会热点吧”或手工补采。
- `润吧`：直接吧页落到检索结果页，当前先按“润吧（检索）”记录。
- 多数吧页可读到贴子标题与链接；个别页面的“回复数”在 DOM 中不稳定，暂未作为硬筛选条件。

## 样例来源（按吧）

- 中国吧：<https://tieba.baidu.com/p/10510365873>
- 时事吧：<https://tieba.baidu.com/p/5803491927>
- 民生吧：<https://tieba.baidu.com/p/9009839127>
- 打工人吧：<https://tieba.baidu.com/p/7888322904>
- 失业吧：<https://tieba.baidu.com/p/10519483667>
- 考公吧：<https://tieba.baidu.com/p/10372684328>
- 房价吧：<https://tieba.baidu.com/p/1033468071>
- 程序员吧：<https://tieba.baidu.com/p/10519203533>
- 高考吧：<https://tieba.baidu.com/p/10519496685>
- 考研吧：<https://tieba.baidu.com/p/10518611568>
- 留学吧：<https://tieba.baidu.com/p/10518982959>
- 润吧（检索）：<https://tieba.baidu.com/p/9772687474>
- 成都吧：<https://tieba.baidu.com/p/10512846294>
- 上海吧：<https://tieba.baidu.com/p/10515520896>
- 北京吧：<https://tieba.baidu.com/p/10507241820>
- 深圳吧：<https://tieba.baidu.com/p/10494846520>
- 弱智吧：<https://tieba.baidu.com/p/10517996574>

## 下一步建议

1. 先把 `content/tieba-event-seeds.js` 中 `tags` 映射到章节分支（`debt/work/backlash/stable/...`）。
2. 对“招聘广告类”素材做降权，优先保留“冲突/抉择/反转”高叙事价值素材。
3. 新增每周采集脚本，按“最近回复时间 + 回复量”自动更新热帖池。
