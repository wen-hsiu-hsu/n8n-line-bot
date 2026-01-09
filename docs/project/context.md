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

### 3. 行事曆 (Calendar)
- **ID**: `0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e`
- **已知欄位 (Properties)**:
  - `季度` (Relation): 關聯至「季租承租紀錄」
  - `時間` (Date): 打球日期
  - `類型` (Select): e.g., "暫停"
  - `場地數` (Number): 該次活動的場地數量 override
  - `請假人` (Relation)

## System Constants

### Manager Info
- **Manager User ID**: `U2a0a2c5054c4fa12b78a1d059411e39c` (Line User ID)

### Commands (Defined in Command Controller)
- `!owe` / `！欠`: 查詢未繳費名單
- `!command` / `！指令`: 查詢指令列表
- `!participants` / `!people` / `！報名人`: 查詢季度報名人 (可選參數: `e.g. !participants 2025-Q1`)
- `!next` (Admin only): 下一次通知

### Code Constants (Default Values)
- **Default Courts**: `2` (metadata node)
- **Default Price**: `170` (metadata node)
- **Courts Density**: `7` (players per court, defined in `下次打球 v2`)
- **Default Off Counts**: `0` (metadata node)
