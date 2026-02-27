# 文档总览（2026 重构版）

本目录以“面向中国玩家的都市生存题材、移动端优先的卡牌 Web Game”为唯一基线。

## 结构

- `docs/product/`：产品定位、玩法设计、移动端体验规范
- `docs/architecture/`：系统分层、核心协议、事件内容策略
- `docs/engineering/`：重构计划、测试与质量策略
- `docs/release/`：发布清单、部署与运维流程

## 文档约束

- 任何新需求先更新 `product` 文档，再落到 `architecture` 与 `engineering`。
- 架构改动必须同步 `architecture/system-overview.md`。
- 发布流程改动必须同步 `release/release-playbook.md`。
