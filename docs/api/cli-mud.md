# CLI MUD API

接口: `POST /api/mud/run`

当请求头包含 `x-client-mode: cli`（或 `Accept: text/plain`）时，接口返回纯文本战报；否则返回 JSON。

该接口由共享核心 `core/mud-engine.js` 驱动，CLI 本地模式与远程 API 使用同一套动作语义。

## Actions

- `new`: 创建新局
- `status`: 查看状态
- `step`: 推进 1 回合
- `auto`: 批量推进（传 `steps`）
- `choose`: 处理关键抉择（传 `option`）

## Curl 示例

```bash
BASE="https://adventure-simulator.vercel.app"

# 1) 新建一局（纯文本）
curl -sS -X POST "$BASE/api/mud/run" \
  -H 'Content-Type: application/json' \
  -H 'x-client-mode: cli' \
  -d '{"action":"new","name":"老李"}'
```

```bash
# 2) JSON 模式拿到 run 对象
RUN=$(curl -sS -X POST "$BASE/api/mud/run" \
  -H 'Content-Type: application/json' \
  -d '{"action":"new","name":"老李"}')

# 3) 推进 5 回合（CLI 输出）
curl -sS -X POST "$BASE/api/mud/run" \
  -H 'Content-Type: application/json' \
  -H 'x-client-mode: cli' \
  -d "{\"action\":\"auto\",\"steps\":5,\"run\":$(echo "$RUN" | jq -c '.run')}"
```

```bash
# 4) 如果出现关键抉择，用 choose
curl -sS -X POST "$BASE/api/mud/run" \
  -H 'Content-Type: application/json' \
  -H 'x-client-mode: cli' \
  -d "{\"action\":\"choose\",\"option\":\"logistics\",\"run\":$(echo "$RUN" | jq -c '.run')}"
```
