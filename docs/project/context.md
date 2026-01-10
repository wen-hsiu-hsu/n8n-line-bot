# Project Context

此檔案記錄無法單純從代碼中完全推斷的專案背景資訊，包含資料庫定義、Schema 與常數設定。

## Notion Databases

### 1. 人員清單 (People List)
- **ID**: `252f388d-4ac7-49a4-82ae-a7f18044f701`
- **已知欄位 (Properties)**:
  - `Name` (Title): 成員姓名 (或 `name` 屬性)
  - `結清` (Checkbox): 繳費狀態

### 2. 季租承租紀錄 (Season Rental Record)
- **ID**: `7deede34-579d-4c77-b79b-20b9f4f000e7`
- **已知欄位 (Properties)**:
  - `季租時段` (Title): 季度名稱 (e.g., "2025-Q1")
  - `報名人` (Relation): 關聯至「人員清單」
  - `零打費用` (Number)
  - `報名人數` (Formula)
  - `每人平均場租` (Formula)
  - `場租總金額` (Formula)
  - `場地數` (Number)
  - `地點` (Rich Text)
  - `打球日` (Relation): 關聯至「行事曆」

### 3. 行事曆 (Calendar)
- **ID**: `0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e`
- **已知欄位 (Properties)**:
  - `季度` (Relation): 關聯至「季租承租紀錄」
  - `時間` (Date): 打球日期
  - `類型` (Select): e.g., "暫停"
  - `場地數` (Number): 該次活動的場地數量 override
  - `請假人` (Relation)

### 4. 所有公告 (All Announcements)
- **ID**: `2e24dbf2-e21c-80b7-83f6-ef99c1dd9425`
- **已知內容 (Pages)**:
  - `NEWS_TEMPLATE`: 公告模板，內容儲存於其 Child Blocks。
  - `PAYMENT`: 付款資訊，內容儲存於其 Child Blocks。
  - `WELCOME_MESSAGE`: 歡迎訊息，當機器人被加入群組/聊天室時自動發送。
    - **支援的 Placeholder**:
      - `{NEW_FRIEND}`: 自動替換為加入群組的新成員（使用 LINE textV2 mention）
      - `{MANAGER}`: 自動替換為管理員（User ID: `U2a0a2c5054c4fa12b78a1d059411e39c`）
    - **實現方式**: 使用 LINE Messaging API **Text Message v2** 格式
      - `type: "textV2"`
      - 使用 `substitution` 物件定義 placeholder 的 mention 替換

### 5. TEXT_REPLY (自動回覆)
- **ID**: `2e34dbf2-e21c-8047-8ac5-fccfc5c02729`
- **用途**: 當使用者的文字訊息「包含」任一 `name` 時，自動回覆對應的 `property_reply`
- **已知欄位 (Properties)**:
  - `name` (Title): 觸發關鍵字
  - `property_reply` (Text): 對應的回覆訊息
  - `property_message` (Text): 觸發訊息（與 name 相同）
  - `property_created` (Date): 建立時間


## System Constants

### Manager Info
- **Manager User ID**: `U2a0a2c5054c4fa12b78a1d059411e39c` (Line User ID)

### Commands (Defined in Command Controller)
- `!owe` / `！欠`: 查詢未繳費名單
- `!command` / `！指令`: 查詢指令列表
- `!participants` / `!people` / `！報名人`: 查詢季度報名人 (可選參數: `e.g. !participants 2025-Q1`)
- `!next` (Admin only): 下一次通知
- `!news` / `!announcement` / `！公告`: 查詢最新公告
- `!payment` / `！付款`: 查詢付款資訊

### Event Handlers
- **Join Event**: 當機器人被加入 `group` 或 `room` 時，會觸發 `取得歡迎訊息` 並回覆。

### Code Constants (Default Values)
- **Default Courts**: `2` (metadata node)
- **Default Price**: `170` (metadata node)
- **Courts Density**: `7` (players per court, defined in `下次打球 v2`)
- **Default Off Counts**: `0` (metadata node)
