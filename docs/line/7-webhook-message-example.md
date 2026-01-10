# LINE Webhook 範例：使用者傳送訊息事件

本文件提供使用者傳送訊息時的 webhook 輸出範例。

## 使用時機

當需要開發與**使用者傳送訊息**相關的功能時，請先閱讀此範例以了解完整的 webhook 結構。

---

## 完整 Webhook 輸出範例

```json
[
  {
    "headers": {
      "host": "your-domain.zeabur.app",
      "user-agent": "LineBotWebhook/2.0",
      "content-length": "794",
      "content-type": "application/json; charset=utf-8",
      "x-forwarded-for": "XXX.XX.XXX.XXX",
      "x-forwarded-host": "your-domain.zeabur.app",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
      "x-line-signature": "REDACTED_SIGNATURE",
      "x-real-ip": "XXX.XX.XXX.XXX",
      "x-zeabur-container-port": "5678",
      "x-zeabur-ip-country": "JP",
      "x-zeabur-request-id": "hnd1::xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "accept-encoding": "gzip"
    },
    "params": {},
    "query": {},
    "body": {
      "destination": "UXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "events": [
        {
          "type": "message",
          "message": {
            "type": "text",
            "id": "595988571795226693",
            "quoteToken": "REDACTED_QUOTE_TOKEN",
            "markAsReadToken": "REDACTED_MARK_AS_READ_TOKEN",
            "text": "dgf"
          },
          "webhookEventId": "01KEMH6NRRRZ7E5JC5QTA9YRZE",
          "deliveryContext": {
            "isRedelivery": false
          },
          "timestamp": 1768068175131,
          "source": {
            "type": "user",
            "userId": "UXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          },
          "replyToken": "REDACTED_REPLY_TOKEN",
          "mode": "active"
        }
      ]
    },
    "webhookUrl": "https://your-domain.zeabur.app/webhook-test/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "executionMode": "test"
  }
]
```

---

## 關鍵欄位說明

### Headers
- **x-line-signature**: LINE 平台的簽章驗證（已隱藏）
- **user-agent**: 固定為 `LineBotWebhook/2.0`
- **x-zeabur-ip-country**: 來源國家（此例為 JP）

### Body
- **destination**: Bot 的 User ID（目的地）
- **events[0].type**: 事件類型為 `"message"`
- **events[0].message.type**: 訊息類型為 `"text"`
- **events[0].message.text**: 使用者傳送的文字內容（此例為 `"dgf"`）
- **events[0].message.quoteToken**: 用於引用訊息的 token
- **events[0].message.markAsReadToken**: 用於標記已讀的 token
- **events[0].source.type**: 來源類型為 `"user"`
- **events[0].source.userId**: 傳送訊息的使用者 ID
- **events[0].replyToken**: 用於回覆的 token（有效期限短，僅能使用一次）
- **events[0].timestamp**: 事件時間戳（Unix milliseconds）
- **events[0].mode**: 運作模式（`"active"` 表示正常模式）

### 其他
- **webhookUrl**: 此 webhook 的 URL
- **executionMode**: 執行模式（`"test"` 表示測試模式）

---

## n8n 開發注意事項

1. **訊息內容取得**: 使用 `$json.body.events[0].message.text` 取得使用者傳送的文字
2. **回覆 Token**: 使用 `$json.body.events[0].replyToken` 進行回覆（一次性）
3. **使用者 ID**: 使用 `$json.body.events[0].source.userId` 識別使用者
4. **訊息類型判斷**: 先檢查 `$json.body.events[0].message.type` 是否為 `"text"`，再處理文字內容

---

## 相關文件

- [Webhook Events](2-webhook-events.md) - 完整事件類型說明
- [Message Objects](3-message-objects.md) - 訊息物件格式
- [Reply API](1-reply-api.md) - 如何使用 replyToken 回覆
