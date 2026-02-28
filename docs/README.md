# 文档总览（2026-02-28）

本目录以“面向中国玩家、移动端优先、都市生存题材的卡牌选择 Web Game”为唯一基线。

## 结构

- `docs/product/`：玩法定义、内容策略、事件因果链、微信传播设计
- `docs/architecture/`：系统分层、内容策略、兼容协议说明
- `docs/engineering/`：测试质量与当前状态审计
- `docs/release/`：部署与发布流程

## 当前必读

- [基线决议（单一真相）](./architecture/baseline-decisions.md)
- [游戏设计基线（V4）](./product/game-design-baseline.md)
- [当前玩法机制基线（实现对齐）](./product/current-gameplay-mechanics.md)
- [事件因果链设计](./product/event-causal-chain-design.md)
- [贴吧内容引入策略](./product/tieba-content-integration.md)
- [微信传播导向重设计](./product/wechat-mobile-redesign.md)
- [系统架构总览](./architecture/system-overview.md)
- [发布与部署手册](./release/release-playbook.md)

## 文档维护约束

- 先改 `product`，再同步 `architecture` 与 `release`。
- 代码行为变化（例如分享机制、天数目标、失败条件）必须同步文档。
- 过期计划文档需及时归档或删除，避免与现网行为冲突。
