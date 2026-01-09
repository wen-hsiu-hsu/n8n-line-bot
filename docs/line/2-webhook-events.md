# 2. Webhook Event Objects

### 2.1 Common Properties（所有事件的共同屬性）

```json
{
  "destination": "xxxxxxxxxx",
  "events": [
    {
      "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
      "type": "message",
      "mode": "active",
      "timestamp": 1462629479859,
      "source": {
        "type": "user",
        "userId": "U4af4980629..."
      },
      "webhookEventId": "01234567890abcdef",
      "deliveryContext": {
        "isRedelivery": false
      }
    }
  ]
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `destination` | String | 接收 webhook 的機器人 ID |
| `events` | Array | Webhook 事件物件的陣列 |
| `replyToken` | String | 用於回覆訊息的 token（不是所有事件都有） |
| `type` | String | 事件類型（`message`, `postback`, `follow`, `join`, `leave` 等） |
| `mode` | String | Channel 狀態，`active` 或 `standby` |
| `timestamp` | Long | 事件發生時間（毫秒） |
| `source` | Object | 事件來源物件（使用者、群組或聊天室） |
| `webhookEventId` | String | Webhook 事件的 ID |
| `deliveryContext` | Object | 傳遞上下文，包含 `isRedelivery` 標記 |

---

### 2.2 Message Event（訊息事件）

當使用者向機器人傳送訊息時觸發。

```json
{
  "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
  "type": "message",
  "mode": "active",
  "timestamp": 1462629479859,
  "source": {
    "type": "user",
    "userId": "U4af4980629..."
  },
  "message": {
    "type": "text",
    "id": "100001",
    "text": "Hello, world"
  }
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `message` |
| `replyToken` | String | ✅ 可回覆的事件，包含此欄位 |
| `message` | Object | 訊息物件，包含 `type` 和根據類型的其他欄位 |

**可回覆**: ✅ 是

---

### 2.3 Member Join Event（成員加入事件）

當使用者加入機器人所在的群組或聊天室時觸發。

```json
{
  "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
  "type": "join",
  "mode": "active",
  "timestamp": 1462629479859,
  "source": {
    "type": "group",
    "groupId": "Ca56f4a45e49..."
  },
  "joined": {
    "members": [
      {
        "type": "user",
        "userId": "U4af4980629..."
      }
    ]
  }
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `join` |
| `replyToken` | String | ✅ 可回覆的事件 |
| `joined` | Object | 包含 `members` 陣列，列出加入的成員 |

**可回覆**: ✅ 是

---

### 2.4 Postback Event（回傳事件）

當使用者點擊 Template Message 或 Quick Reply 中的按鈕時觸發。

```json
{
  "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
  "type": "postback",
  "mode": "active",
  "timestamp": 1462629479859,
  "source": {
    "type": "user",
    "userId": "U4af4980629..."
  },
  "postback": {
    "data": "action=buy&itemid=111",
    "params": {
      "date": "2017-12-25",
      "time": "10:00"
    }
  }
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `postback` |
| `replyToken` | String | ✅ 可回覆的事件 |
| `postback.data` | String | 按鈕設定的回傳資料 |
| `postback.params` | Object | 可選的回傳參數（如日期、時間等） |

**可回覆**: ✅ 是

---

### 2.5 Unsend Event（取消傳送事件）

當使用者取消傳送訊息時觸發。

```json
{
  "type": "unsend",
  "mode": "active",
  "timestamp": 1462629479859,
  "source": {
    "type": "user",
    "userId": "U4af4980629..."
  },
  "unsend": {
    "messageId": "100001"
  }
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `unsend` |
| `unsend.messageId` | String | 被取消傳送的訊息 ID |

**可回覆**: ❌ 否（無 replyToken）
