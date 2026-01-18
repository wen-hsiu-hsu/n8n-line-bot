# Notion Database Schema Reference

> **⚠️ Auto-Generated File**: 此檔案由 `scripts/update-notion-schema.js` 自動產生與更新。
>
> **最後更新時間**: 2026-01-18T08:36:41.350Z

此檔案記錄所有 Notion Database 的完整 schema（欄位定義、型別、選項等），供 AI 在開發新功能時參考。

---

## 使用指南

### 1. 更新 Database Schema
當需要取得最新的 database schema 時，執行以下指令：

```bash
# 更新所有 databases
node scripts/update-notion-schema.js

# 更新特定 database（透過 database name）
node scripts/update-notion-schema.js --db "USERS"

# 更新多個特定 databases
node scripts/update-notion-schema.js --db "USERS,TEXT_REPLY"
```

### 2. 環境變數設定
腳本會從 `.env` 讀取 `NOTION_TOKEN`，確保以下變數存在：

```env
NOTION_TOKEN=secret_your_notion_integration_token
```

### 3. 何時更新此檔案
- 在 Notion 中新增或修改 database 欄位後
- 開發新功能前，確保 schema 與 Notion 同步
- 發現文件與實際 database 不一致時

---

## Database Inventory

以下是所有已知的 Notion Databases：

| Database Name | Database ID | 用途 | 最後更新 |
|--------------|-------------|------|---------|
| 人員清單 (People List) | `252f388d-4ac7-49a4-82ae-a7f18044f701` | 成員管理 | 2026-01-18T08:18:17.128Z |
| 季租承租紀錄 (Season Rental Record) | `7deede34-579d-4c77-b79b-20b9f4f000e7` | 季度報名記錄 | 2026-01-18T08:18:18.149Z |
| 行事曆 (Calendar) | `0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e` | 打球日程 | 2026-01-18T08:18:18.415Z |
| 所有公告 (All Announcements) | `2e24dbf2-e21c-80b7-83f6-ef99c1dd9425` | 公告模板 | 2026-01-18T08:18:18.663Z |
| TEXT_REPLY (TEXT_REPLY) | `2e34dbf2-e21c-8047-8ac5-fccfc5c02729` | 自動回覆規則 | 2026-01-18T08:18:18.931Z |
| USERS (USERS) | `2e44dbf2-e21c-80d1-af81-c3b61579b3bb` | 使用者追蹤 | 2026-01-18T08:18:19.180Z |

---

## Database Schemas

### 1. 人員清單

### 人員清單

**Database ID**: `252f388d-4ac7-49a4-82ae-a7f18044f701`

**最後更新**: 2026-01-18T08:36:39.087Z

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `報名季度` | relation | <pre>{
  "database_id": "7deede34-579d-4c77-b79b-20b9f4f000e7",
  "type": "dual_property"
}</pre> |
| `未繳季租` | formula | <pre>{
  "expression": "filter(map({{notion:block_property:BJ%3Fu:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}, if (includes({{notion:block_property:%5CkQb:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}, current), \"\", current)), current)"
}</pre> |
| `已繳季租` | rollup | <pre>{
  "relation_property_name": "付款",
  "rollup_property_name": "子項｜季租繳費",
  "function": "show_original"
}</pre> |
| `USER` | relation | <pre>{
  "database_id": "2e44dbf2-e21c-80d1-af81-c3b61579b3bb",
  "type": "dual_property"
}</pre> |
| `結清` | formula | <pre>{
  "expression": "if (length( {{notion:block_property:EYBc:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}} ) == 0, true, false)"
}</pre> |
| `付款` | relation | <pre>{
  "database_id": "4573dc24-ef10-4241-971f-af4ed8a986d1",
  "type": "dual_property"
}</pre> |
| `Name` | title | - |

---

---

---

### 2. 季租承租紀錄

### 季租承租紀錄

**Database ID**: `7deede34-579d-4c77-b79b-20b9f4f000e7`

**最後更新**: 2026-01-18T08:36:40.382Z

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `備註` | rich_text | - |
| `報名人` | relation | <pre>{
  "database_id": "252f388d-4ac7-49a4-82ae-a7f18044f701",
  "type": "dual_property"
}</pre> |
| `公告` | relation | <pre>{
  "database_id": "2e24dbf2-e21c-80b7-83f6-ef99c1dd9425",
  "type": "dual_property"
}</pre> |
| `地點` | rich_text | - |
| `場地數` | number | <pre>{
  "format": "number"
}</pre> |
| `每人平均場租（特殊狀況）` | number | <pre>{
  "format": "number"
}</pre> |
| `場租總金額` | formula | <pre>{
  "expression": "{{notion:block_property:T%3BPJ:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}*{{notion:block_property:%7CMRs:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}*{{notion:block_property:~%3B%60G:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}*2"
}</pre> |
| `打球日` | relation | <pre>{
  "database_id": "0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e",
  "type": "dual_property"
}</pre> |
| `報名人數` | formula | <pre>{
  "expression": "{{notion:block_property:G%40xy:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}.length()"
}</pre> |
| `合約` | files | - |
| `每人平均場租` | formula | <pre>{
  "expression": "{{notion:block_property:UI~W:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}.empty().if({{notion:block_property:%5By%60%3B:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}}/{{notion:block_property:ndOW:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}},{{notion:block_property:UI~W:00000000-0000-0000-0000-000000000000:2ca07b89-11ab-49f2-a287-247d6c6d73b7}})"
}</pre> |
| `零打費用` | number | <pre>{
  "format": "number"
}</pre> |
| `租借次數 (2hrs)` | number | <pre>{
  "format": "number"
}</pre> |
| `每場/小時 定價` | number | <pre>{
  "format": "number_with_commas"
}</pre> |
| `季租時段` | title | - |

---

---

---

### 3. 行事曆

### 行事曆

**Database ID**: `0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e`

**最後更新**: 2026-01-18T08:36:40.619Z

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `請假人` | relation | <pre>{
  "database_id": "252f388d-4ac7-49a4-82ae-a7f18044f701",
  "type": "single_property"
}</pre> |
| `季度` | relation | <pre>{
  "database_id": "7deede34-579d-4c77-b79b-20b9f4f000e7",
  "type": "dual_property"
}</pre> |
| `詳細內容` | rich_text | - |
| `場地數` | number | <pre>{
  "format": "number"
}</pre> |
| `類型` | select | <pre>{
  "options": [
    {
      "name": "繳費",
      "color": "orange"
    },
    {
      "name": "報名",
      "color": "yellow"
    },
    {
      "name": "打球",
      "color": "blue"
    },
    {
      "name": "打球暫停",
      "color": "red"
    }
  ]
}</pre> |
| `時間` | date | - |
| `零打` | relation | <pre>{
  "database_id": "252f388d-4ac7-49a4-82ae-a7f18044f701",
  "type": "single_property"
}</pre> |
| `名稱` | title | - |

---

---

---

### 4. 所有公告

### 所有公告

**Database ID**: `2e24dbf2-e21c-80b7-83f6-ef99c1dd9425`

**最後更新**: 2026-01-18T08:36:40.867Z

> **注意**: 此 database 包含特殊 pages（`NEWS_TEMPLATE`, `PAYMENT`, `WELCOME_MESSAGE`），其內容儲存於 Child Blocks。

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `季度` | relation | <pre>{
  "database_id": "7deede34-579d-4c77-b79b-20b9f4f000e7",
  "type": "dual_property"
}</pre> |
| `Date` | date | - |
| `Name` | title | - |

---

---

---

### 5. TEXT_REPLY

### TEXT_REPLY

**Database ID**: `2e34dbf2-e21c-8047-8ac5-fccfc5c02729`

**最後更新**: 2026-01-18T08:36:41.100Z

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `Created` | created_time | - |
| `Reply` | rich_text | - |
| `Message` | title | - |

---

---

---

### 6. USERS

### USERS

**Database ID**: `2e44dbf2-e21c-80d1-af81-c3b61579b3bb`

**最後更新**: 2026-01-18T08:36:41.350Z

#### Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| `is_admin` | checkbox | - |
| `groups` | multi_select | <pre>{
  "options": [
    {
      "name": "Ca18e766e2730654fc1ca2573a14e01e2",
      "color": "default"
    },
    {
      "name": "C9fb61df21d9118e77d6e3065716fc08a",
      "color": "yellow"
    }
  ]
}</pre> |
| `Registered name` | relation | <pre>{
  "database_id": "252f388d-4ac7-49a4-82ae-a7f18044f701",
  "type": "dual_property"
}</pre> |
| `message_counts` | number | <pre>{
  "format": "number"
}</pre> |
| `Custom Name` | rich_text | - |
| `multi-chat` | multi_select | - |
| `user_id` | title | - |

---

---

---

## Schema 欄位說明

每個 database schema 包含以下資訊：

- **Property Name**: 欄位名稱（英文 key）
- **Display Name**: 顯示名稱（中文或其他語言）
- **Type**: 欄位型別（title, rich_text, number, select, multi_select, checkbox, relation, formula, date 等）
- **Configuration**: 型別特定的設定（如 select options, formula expression, relation target 等）

---

## 注意事項

1. **不包含實際資料**: 此檔案僅記錄 schema 定義，不包含任何實際的 database entries。
2. **與 context.md 的關係**: `docs/project/context.md` 記錄商業邏輯與常數，而此檔案專注於技術性的 schema 定義。
3. **自動更新**: 每次執行 `update-notion-schema.js` 會覆寫對應的 database section，請勿手動編輯 schema 內容。
