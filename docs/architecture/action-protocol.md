# Core Action 协议

## 入口

- 方法：`createMudService().runAction(payload)`
- API：`POST /api/mud/run`

## 支持动作

- `new`: 新建会话
- `state`: 获取当前状态
- `play`: 出牌（`cardIndex`）
- `end`: 结束回合
- `reward`: 选择奖励（`cardId|null`）
- `remove`: 删除牌（`cardId`）
- `next`: 下一节点
- `restart`: 重开当前会话

## 返回结构

- `ok: boolean`
- `sessionId: string`（成功时）
- `state: GameState`（成功时）
- `error: string`（失败时）
