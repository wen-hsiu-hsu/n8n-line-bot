# n8n Common Errors & Solutions

此檔案記錄在 n8n 開發過程中常見的錯誤與解決方案。在開始開發前，請務必閱讀此檔案以避免重複錯誤。

## 1. Module 'luxon' is disallowed

**錯誤訊息**:
```
"errorMessage": "Module 'luxon' is disallowed [line 1]"
```

**原因**:
n8n 的 Code Node 運行環境中，直接使用 `require('luxon')` 會被安全性原則阻擋。

**解決方案**:
n8n 環境中已經全域注入了 `DateTime` 物件 (來自 Luxon)。
**不需要** `require`，直接使用 `DateTime` 即可。

**錯誤範例**:
```javascript
const { DateTime } = require('luxon'); // ❌ Error
return DateTime.now();
```

**正確範例**:
```javascript
// ✅ 直接使用全域 DateTime
return DateTime.now();
```

## 2. Double Escaping of Newlines (`\\n` vs `\n`)

**錯誤現象**:
Line Bot 回傳的訊息中，出現了直接顯示出來的 `\n` 字元，而不是預期的換行。

**原因**:
在 n8n JSON 中撰寫 JavaScript Code 時，過度轉義了換行符號。
例如使用了 `\\n`，這在 JSON 解析後會變成 JavaScript 中的字串 `"\n"` (兩個字元: Backslash + n)，而不是換行符號。

**解決方案**:
在 JavaScript Code Node 中，字串連接應該使用單一轉義 `\n`，或直接使用 Template Literal 的換行。

**錯誤範例**:
```javascript
// ❌ 顯示結果為: Hello\nWorld
return { text: "Hello\\nWorld" };
```

**正確範例**:
```javascript
// ✅ 顯示結果為換行
return { text: "Hello\nWorld" };

// ✅ 或者使用 Template Literal
return { text: `Hello
World` };
```

## 3. LINE API 400 Error: `textV2` and `{}` Brackets

**錯誤訊息**:
```
"errorMessage": "Bad request - please check your parameters",
"errorDescription": "A message (messages[0]) in the request body is invalid",
"details": [
  {
    "message": "The key '!owe' enclosed in '{}' does not match the pattern '^[a-zA-Z0-9_]{1,20}$'.",
    "property": "text"
  }
]
```

**原因**:
LINE 的 `textV2` 訊息類型會將 `{}` 視為 placeholder (用於 Mention 等功能)。如果 `{}` 內的內容不符合特定格式，API 會報 400 錯誤。

**解決方案**:
如果不需要 Mention 功能，請改用基本的 `text` 訊息類型。

**錯誤範例**:
```javascript
// ❌ 使用 textV2 會導致 LINE 解析 {!owe} 失敗
return {
  "type": "textV2",
  "text": "{!owe} : 未繳費名單"
};
```

**正確範例**:
```javascript
// ✅ 使用基本的 text 類型即可安全包含任何大括號內容
return {
  "type": "text",
  "text": "{!owe} : 未繳費名單"
};
```

## 4. Notion Node Error: `body failed validation` (Date Filter)

**錯誤訊息**:
```
"errorMessage": "Bad request - please check your parameters",
"errorDescription": "body failed validation. Fix one:\nbody.filter.and[0].date.equals should be a string, instead was `{}`..."
```

**原因**:
當在 Notion Node 的 `Filter Type` 設為 `Manual` 時，若針對 Date 欄位使用 Expression (例如 `{{ $json.date }}`)，n8n 在驗證階段可能無法正確解析表達式，導致傳入空物件 `{}` 或 `undefined`，進而觸發參數驗證失敗。

**解決方案**:
將 `Filter Type` 改為 `JSON`，並手動建構過濾器物件。這樣可以繞過 UI 的預先驗證機制，直接將參數傳遞給 API。

**JSON Filter 範例**:
```json
{
  "and": [
    {
      "property": "時間",
      "date": {
        "equals": "{{ $json.nextSaturdayDateText }}"
      }
    }
  ]
}
```

## 5. Merge Node Error: Invalid 'mode' Parameter

**錯誤訊息**:
在 n8n 介面或執行時，發現 Merge Node 無法正確合併，或者行為不如預期。

**原因**:
舊版或特定版本的 n8n 可能不支援某些參數設定。例如 `mergeByIndex` 並不是一個合法的 `mode` 參數值（雖然字面上看起來合理）。在 n8n v1+ 的 Merge Node (版本 2.0+) 中，預設模式通常是 `append` (Append) 或需要明確指定如 `combine` (Combine) 等。

**解決方案**:
- **不要**在 JSON 中手動設定 `"mode": "mergeByIndex"`。
- 請檢查 Merge Node 的 `mode` 設定，通常應設定為 `append` (Append) 或留空使用預設值。

**錯誤範例**:
```json
// ❌ 這是無效的設定
{
  "parameters": {
    "mode": "mergeByIndex"
  },
  "type": "n8n-nodes-base.merge"
}
```

**正確範例**:
```json
// ✅ 使用預設模式 (Append)
{
  "parameters": {},
  "type": "n8n-nodes-base.merge"
}
```

## 6. LINE `unsend` Event 無 `replyToken`

**錯誤現象**:
當處理 LINE `unsend` (收回訊息) 事件時，使用 Reply API 會失敗，或者 `replyToken` 為 `undefined`。

**原因**:
LINE 的 `unsend` webhook event **不包含 `replyToken` 欄位**。這是因為收回訊息是一個「通知」類型的事件，並不預期機器人會直接「回覆」。

**解決方案**:
必須改用 **Push API** (`POST https://api.line.me/v2/bot/message/push`) 來主動推送訊息。

**Unsend Event 結構範例**:
```json
{
  "type": "unsend",
  "mode": "active",
  "timestamp": 1768034450661,
  "source": {
    "type": "group",
    "groupId": "Ca18e766e2730654fc1ca2573a14e01e2",
    "userId": "U2a0a2c5054c4fa12b78a1d059411e39c"
  },
  "unsend": {
    "messageId": "595931980064620851"
  }
  // ⚠️ 注意：沒有 replyToken 欄位
}
```

**錯誤範例（使用 Reply API）**:
```javascript
// ❌ unsend event 沒有 replyToken，會導致 API 錯誤
const replyToken = $json.replyToken; // undefined
return {
  replyToken: replyToken,
  messages: [{ type: "text", text: "我有看到你傳什麼 😈" }]
};
```

**正確範例（使用 Push API）**:
```javascript
// ✅ 從 source 取得推送目標
const source = $json.source;
const to = source.groupId || source.roomId || source.userId;

return {
  to: to,
  messages: [
    {
      type: "text",
      text: "我有看到你傳什麼 😈"
    }
  ]
};
```

**n8n HTTP Request 節點設定**:
- **Method**: `POST`
- **URL**: `https://api.line.me/v2/bot/message/push`
- **Body Parameters**:
  - `to`: `={{ $json.to }}`
  - `messages`: `={{ $json.messages }}`

**無 replyToken 的 LINE Event 清單**:
- ✅ `message`: 有 replyToken（可用 Reply API）
- ✅ `join`: 有 replyToken（可用 Reply API）
- ✅ `memberJoined`: 有 replyToken（可用 Reply API）
- ✅ `postback`: 有 replyToken（可用 Reply API）
- ❌ **`unsend`**: **無** replyToken（必須用 Push API）
- ❌ `follow`: 無 replyToken（視情況使用 Push API）
- ❌ `unfollow`: 無 replyToken（無需回覆）
- ❌ `leave`: 無 replyToken（無需回覆）

**參考文件**: `docs/line/2-webhook-events.md`

## 7. n8n 節點連接方式錯誤：多輸出 vs 並行輸出

**錯誤現象**:
```
Cannot assign to read only property 'name' of object 'Error: Node '取得打球日 (Push)' hasn't been executed'
```

**原因**:
誤解 n8n 的節點連接機制。在 n8n 中：
- **多輸出分支**（index 0, 1, 2）：用於條件判斷節點（如 IF、Switch），每次執行只會走其中一條分支
- **並行輸出**（同一分支連接多個節點）：多個節點會同時接收到相同的輸入數據並並行執行

如果將應該並行執行的節點設定成不同的 index，會導致某些節點沒有被執行，後續節點引用時就會報錯。

**錯誤範例**:
```json
// ❌ 錯誤：將並行節點設為不同分支
"metadata (Push)": {
  "main": [
    [{"node": "取得該季資訊 (Push)", "type": "main", "index": 0}],
    [{"node": "取得打球日 (Push)", "type": "main", "index": 0}],
    [{"node": "Get People Next (Push)", "type": "main", "index": 0}]
  ]
}
// 結果：只有第一個分支會執行，其他兩個節點不會執行
```

**正確範例**:
```json
// ✅ 正確：將並行節點放在同一個分支
"metadata (Push)": {
  "main": [
    [
      {"node": "取得該季資訊 (Push)", "type": "main", "index": 0},
      {"node": "取得打球日 (Push)", "type": "main", "index": 0},
      {"node": "Get People Next (Push)", "type": "main", "index": 0}
    ]
  ]
}
// 結果：三個節點會並行執行，都能接收到 metadata (Push) 的輸出
```

**區分方式**:
- **需要並行**：數據獲取、API 呼叫等可以同時進行的操作
- **需要分支**：IF 節點的 True/False、Switch 節點的不同 case

## 8. 訪問未執行的節點導致錯誤

**錯誤訊息**:
```
Cannot assign to read only property 'name' of object 'Error: Node 'Set Environment (Test)' hasn't been executed'
```

**原因**:
在 Code 節點中使用 `$('節點名稱')` 嘗試訪問一個在當前執行路徑中沒有被執行的節點。

例如：工作流有兩個 Trigger（Manual 和 Schedule），每次執行只會觸發其中一個。如果在下游節點中嘗試訪問兩個 Trigger 後的節點，會導致訪問到未執行的節點。

**錯誤範例**:
```javascript
// ❌ 錯誤：嘗試訪問可能未執行的節點
const testEnv = $("Set Environment (Test)").all();
if (testEnv && testEnv.length > 0) {
  environment = testEnv[0].json.environment;
} else {
  const prodEnv = $("Set Environment (Production)").all();
  environment = prodEnv[0].json.environment;
}
// 如果是 Schedule Trigger，Set Environment (Test) 沒執行，會報錯
```

**正確範例**:
```javascript
// ✅ 正確：從必定執行的上游節點獲取數據
const metadataNode = $("metadata (Push)").first();
const environment = metadataNode?.json?.environment || "production";

// metadata (Push) 是兩條路徑的交集點，必定會被執行
```

**設計原則**:
1. **數據應該沿著執行路徑傳遞**，而不是跨路徑訪問
2. **在分支匯合點之前保存必要的數據**（如 metadata 節點）
3. **使用 Merge 節點匯合後，只能訪問匯合點之後的節點**

## 9. 數據在節點間傳遞時被覆蓋

**錯誤現象**:
在 Code 節點中設定了 `environment` 欄位，但經過幾個 Notion 節點後，該欄位消失了。

**原因**:
大部分 n8n 節點（特別是 API 節點如 Notion、HTTP Request）會將上游的數據**完全替換**為 API 的回應內容，而不是合併。因此，如果你在上游設定的自訂欄位，會在經過這些節點後遺失。

**數據流範例**:
```
metadata (Push) 輸出:
{
  "nextSaturdayQuarter": "2026-Q1",
  "environment": "test"  ✅
}
  ↓
取得該季資訊 (Push) [Notion Node] 輸出:
{
  "id": "123",
  "properties": {...}
  // ❌ environment 欄位被覆蓋了
}
  ↓
下游節點: $json.environment → undefined ❌
```

**解決方案**:

**方案 1：在最上游節點保存，在需要時重新獲取**
```javascript
// 在組起來 (Push) 節點中
const messages = $input.all().map(item => item.json);

// 從 metadata (Push) 重新獲取 environment
const metadataNode = $("metadata (Push)").first();
const environment = metadataNode?.json?.environment || "production";

return {
  messages,
  environment  // 重新注入 environment
}
```

**方案 2：使用 Set 節點設定 workflow 層級的靜態數據**
```json
// Set 節點（在分支起點）
{
  "parameters": {
    "assignments": {
      "assignments": [
        {
          "name": "environment",
          "value": "test",
          "type": "string"
        }
      ]
    }
  }
}
```

**最佳實踐**:
1. **關鍵的上下文數據**（如環境標記、用戶 ID）應該在工作流的**最上游**設定
2. **在需要時從上游節點重新獲取**，而不是依賴中間節點傳遞
3. **Merge 節點不會保留被覆蓋的欄位**，需要手動重新獲取

## 10. 使用 `itemMatches()` 判斷節點執行狀態不可靠

**錯誤用法**:
```javascript
// ❌ 不可靠的判斷方式
if ($('Manual Trigger (Push Test)').itemMatches(0)) {
  // 測試環境
} else {
  // 正式環境
}
```

**原因**:
`itemMatches()` 的行為在不同場景下可能不一致，且嘗試訪問未執行的節點本身就會導致錯誤。

**正確方案**:

**方案 1：使用明確的環境標記**
```
Manual Trigger → Set Environment (Test) [設定 environment="test"]
Schedule Trigger → Set Environment (Production) [設定 environment="production"]
  ↓
在下游判斷: {{ $json.environment }} equals "test"
```

**方案 2：使用不同的 Webhook URL**
```javascript
// 判斷 webhook url 包含特定關鍵字
if ($('Webhook').first().json.webhookUrl.includes('webhook-test')) {
  // 測試環境
} else {
  // 正式環境
}
```

**最佳實踐**:
- ✅ 使用**明確的數據欄位**來標記狀態（如 `environment` 欄位）
- ✅ 使用 **Set 節點**在分支起點設定標記
- ❌ 不要依賴節點執行狀態的推斷

## 11. 使用並行連接優化效能：移除阻塞依賴

**場景**:
當某個流程（如資料庫更新、日誌記錄）需要執行，但後續的主要業務邏輯不依賴其執行結果時，可以使用並行連接來避免阻塞。

**範例：使用者表更新流程優化**

**問題**:
```
Check User Source
  ↓ (有 userId)
取得使用者表 → ... (9 個節點) → Restore Original Event
  ↓
Event Switch ⚠️ 被阻塞，需等待使用者表更新完成
```

當事件有 `userId` 時，Event Switch 必須等待整個使用者表更新流程（9 個節點）完成。但實際上，目前的功能都還沒有用到使用者表的資訊，這個等待是不必要的。

**解決方案：並行執行**

利用 n8n 的並行連接機制，讓條件節點同時連接到兩個目標：
1. 資料更新流程（成為獨立的 side effect）
2. 主要業務邏輯（立即執行）

**修改前的連接**:
```json
"Check User Source": {
  "main": [
    [
      {"node": "取得使用者表", "type": "main", "index": 0}
    ],
    [
      {"node": "Event Switch", "type": "main", "index": 0}
    ]
  ]
}
```

**修改後的連接**:
```json
"Check User Source": {
  "main": [
    [
      {"node": "取得使用者表", "type": "main", "index": 0},
      {"node": "Event Switch", "type": "main", "index": 0}
    ],
    [
      {"node": "Event Switch", "type": "main", "index": 0}
    ]
  ]
}
```

同時移除原本的阻塞連接：
```json
// 從這樣
"Restore Original Event": {
  "main": [
    [{"node": "Event Switch", "type": "main", "index": 0}]
  ]
}

// 改成這樣（清空輸出）
"Restore Original Event": {
  "main": []
}
```

**結果**:
```
Check User Source
  ├─ Output 0 (有 userId) ─┬→ 取得使用者表 → ... → Restore Original Event (並行執行)
  │                        └→ Event Switch (立即執行) ✅
  └─ Output 1 (無 userId) ──→ Event Switch
```

**效益**:
- Event Switch 不再等待使用者表更新（省略 9 個節點的執行時間）
- 使用者表仍會正常更新，只是變成非阻塞的 side effect
- 主要業務邏輯的回應速度大幅提升

**注意事項**:
1. **資料可用性**：並行執行意味著資料不會立即可用。如果未來某個功能需要使用者表資料，必須明確查詢資料庫，不能假設更新已完成。
2. **錯誤處理**：並行流程的錯誤不會阻塞主流程，需要額外的監控機制。
3. **適用場景**：
   - ✅ 日誌記錄、統計更新等 side effect
   - ✅ 不影響當前業務邏輯的資料同步
   - ❌ 主流程依賴的關鍵資料獲取

**最佳實踐**:
- 明確記錄哪些資料是非同步更新的
- 需要該資料時，主動查詢而不是依賴傳遞
- 保持 side effect 流程與業務邏輯隔離

**參考**: 此優化已應用於使用者管理流程，詳見 `docs/project/context.md` 的「並行執行架構」章節。

## 7. Code Node: Can't use .all() in 'Run Once for Each Item' mode

**錯誤訊息**:
```
"errorMessage": "Can't use .all() here [line X, for item 0]",
"errorDescription": "This is only available in 'Run Once for All Items' mode"
```

**原因**:
在 Code Node 中，`$input.all()` 方法只能在預設模式（Run Once for All Items）下使用。如果設定為 `"mode": "runOnceForEachItem"`，則無法使用此方法。

**場景**:
當需要處理 Notion 查詢結果時，可能會遇到空陣列（使用者不存在）的情況。在 `runOnceForEachItem` 模式下，空陣列不會執行任何 iteration，導致後續節點無法取得資料。

**解決方案**:
使用預設的 "Run Once for All Items" 模式，並手動處理 items：

**錯誤範例**:
```javascript
{
  "parameters": {
    "mode": "runOnceForEachItem",  // ❌ 會導致錯誤
    "jsCode": "const users = $input.all(); // Error!"
  }
}
```

**正確範例**:
```javascript
{
  "parameters": {
    // 不設定 mode，使用預設的 "Run Once for All Items"
    "jsCode": `// Get user query results from Notion
const users = $input.all();
const hasValidUser = users.length > 0 && users[0].json && users[0].json.id;

let isAdmin = false;
if (hasValidUser) {
  const user = users[0].json;
  isAdmin = user.property_is_admin === true;
}

// Return as array with proper format
return [{
  json: {
    ...originalData,
    _is_admin: isAdmin
  }
}];`
  }
}
```

**關鍵要點**:
1. **預設模式**: 不設定 `mode` 參數，使用預設的 "Run Once for All Items"
2. **處理空陣列**: 使用 `users.length > 0` 檢查，避免存取不存在的 `users[0]`
3. **返回格式**: 必須返回 `[{json: {...}}]` 格式的陣列
4. **適用場景**: 當上游節點可能返回空陣列（如 Notion filtered query），且需要保證下游節點一定會執行時

**實際案例**:
在 Admin Checking 功能中，查詢 USERS 資料庫時：
- 使用者存在 → Notion 返回 `[{user data}]` → 提取 `property_is_admin`
- 使用者不存在 → Notion 返回 `[]` → 設定 `isAdmin = false`（保守預設值）

兩種情況都需要輸出結果給下游節點，因此不能使用 `runOnceForEachItem` 模式。

**參考**: Admin Checking 實作詳見 `docs/project/context.md` 的「Admin Checking」章節。
