# 3. Message Objects（訊息物件）

### 3.1 Text Message（文字訊息）

用於傳送和接收文字訊息。

#### 發送文字訊息

```json
{
  "type": "text",
  "text": "Hello, world"
}
```

| 欄位名稱 | 型別 | 必填 | 限制 | 說明 |
|---------|------|------|------|------|
| `type` | String | ✅ | - | 固定值 `text` |
| `text` | String | ✅ | Max: 2,000 字 | 訊息文字內容 |

#### 接收文字訊息（Webhook）

```json
{
  "type": "text",
  "id": "100001",
  "text": "Hello, world"
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `text` |
| `id` | String | 訊息 ID |
| `text` | String | 訊息內容 |

---

### 3.2 Text Message (v2)（文字訊息 v2 版本）

支援更多功能的文字訊息版本，包括**文字樣式、表情符號、提及**等功能。

#### 發送文字訊息 (v2)

```json
{
  "type": "text",
  "text": "Hello, world",
  "emojis": [
    {
      "index": 0,
      "length": 5,
      "productId": "5ac1bfd5040ab15980c9b435",
      "emojiId": "001"
    }
  ],
  "mentionedUsers": [
    {
      "index": 0,
      "length": 5,
      "userId": "U4af4980629..."
    }
  ]
}
```

| 欄位名稱 | 型別 | 必填 | 說明 |
|---------|------|------|------|
| `type` | String | ✅ | 固定值 `text` |
| `text` | String | ✅ | 訊息文字內容（Max: 2,000 字） |
| `emojis` | Array | ❌ | LINE 表情符號陣列 |
| `emojis[].index` | Integer | ✅ | 表情在文字中的起始位置 |
| `emojis[].length` | Integer | ✅ | 表情的長度（通常為 5） |
| `emojis[].productId` | String | ✅ | 表情產品 ID |
| `emojis[].emojiId` | String | ✅ | 表情 ID |
| `mentionedUsers` | Array | ❌ | 被提及的使用者陣列 |
| `mentionedUsers[].index` | Integer | ✅ | 提及在文字中的起始位置 |
| `mentionedUsers[].length` | Integer | ✅ | 提及的長度 |
| `mentionedUsers[].userId` | String | ✅ | 被提及的使用者 ID |

#### 文字訊息 v2 範例

**帶有 LINE 表情符號的訊息**:
```json
{
  "type": "text",
  "text": "Hello $",
  "emojis": [
    {
      "index": 6,
      "length": 5,
      "productId": "5ac1bfd5040ab15980c9b435",
      "emojiId": "001"
    }
  ]
}
```

**提及使用者的訊息**:
```json
{
  "type": "text",
  "text": "Hello @User1",
  "mentionedUsers": [
    {
      "index": 6,
      "length": 5,
      "userId": "U4af4980629..."
    }
  ]
}
```

---

### 3.3 Image Message（圖片訊息）

用於傳送圖片訊息。

#### 發送圖片訊息

```json
{
  "type": "image",
  "originalContentUrl": "https://example.com/original.jpg",
  "previewImageUrl": "https://example.com/preview.jpg"
}
```

| 欄位名稱 | 型別 | 必填 | 限制 | 說明 |
|---------|------|------|------|------|
| `type` | String | ✅ | - | 固定值 `image` |
| `originalContentUrl` | String | ✅ | Max: 1,000 字, HTTPS | 原始圖片的 URL，支援 JPG/PNG |
| `previewImageUrl` | String | ✅ | Max: 1,000 字, HTTPS | 預覽圖片的 URL，支援 JPG/PNG |

#### 圖片規格限制

- **原始圖片**: Max 10 MB, JPG/PNG, HTTPS
- **預覽圖片**: Max 10 MB, JPG/PNG, HTTPS
- 建議解析度: 原始圖片 1040x1040px, 預覽圖片 240x240px

#### 接收圖片訊息（Webhook）

```json
{
  "type": "image",
  "id": "100001",
  "contentProvider": {
    "type": "line"
  }
}
```

| 欄位名稱 | 型別 | 說明 |
|---------|------|------|
| `type` | String | 固定值 `image` |
| `id` | String | 訊息 ID |
| `contentProvider.type` | String | 內容提供者，通常為 `line` |

#### 圖片訊息使用範例

```json
{
  "type": "image",
  "originalContentUrl": "https://example.com/images/original.jpg",
  "previewImageUrl": "https://example.com/images/preview.jpg"
}
```
