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
