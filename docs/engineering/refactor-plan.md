# 重构计划（以 architecture 为准）

## Phase 1（已完成）

- 建立 Core 统一入口（runAction）
- 恢复 API/CLI 适配层
- 增加服务层测试

## Phase 2（进行中）

- Web UI 切换为 action 协议驱动
- 剥离 UI 对 run 内部结构的直接依赖

## Phase 3（待开始）

- 增加事件 schema 校验与 replay 能力
- 接入 CI：`check:events` / `check:replay`

## Phase 4（待开始）

- 文档与代码完全一致化
- 完成发布前稳定性与平衡性收口

## 内容扩容专项

- 剧情分支与贴吧内容扩容执行计划见：
  - `docs/engineering/story-branch-expansion-plan.md`
