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
