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

### 6. USERS (使用者資料庫)
- **ID**: `2e44dbf2-e21c-80d1-af81-c3b61579b3bb`
- **用途**: 追蹤與機器人互動的所有使用者，記錄訊息數量與所在群組/聊天室
- **已知欄位 (Properties)**:
  - `user_id` (Title): LINE User ID（唯一識別碼）
  - `is_admin` (Checkbox): 是否為管理員（預設: `false`）
  - `message_counts` (Number): 使用者累積發送的訊息數量
  - `Custom Name` (Rich Text): 使用者自訂名稱（保留欄位，目前未使用）
  - `groups` (Multi-select): 使用者所在的所有群組 ID 列表（來自 `source.groupId`）
  - `multi-chat` (Multi-select): 使用者所在的所有聊天室 ID 列表（來自 `source.roomId`）
- **資料來源對應**:
  - 群組訊息（`source.type = "group"`）→ 更新 `groups` 欄位
  - 聊天室訊息（`source.type = "room"`）→ 更新 `multi-chat` 欄位
  - 私訊（`source.type = "user"`）→ 兩個欄位都不更新


## System Constants

### Manager Info
- **Admin Checking Method**: Dynamic check via USERS database `is_admin` field
- **Implementation**: Lazy-loaded Notion queries in command and auto reply paths
- ~~**Manager User ID**: `U2a0a2c5054c4fa12b78a1d059411e39c` (Deprecated - now using database)~~

### Commands (Defined in Command Controller)
- `!owe` / `！欠`: 查詢未繳費名單
- `!command` / `！指令`: 查詢指令列表
- `!participants` / `!people` / `！報名人`: 查詢季度報名人 (可選參數: `e.g. !participants 2025-Q1`)
- `!next` (Admin only): 下一次通知
- `!news` / `!announcement` / `！公告`: 查詢最新公告
- `!payment` / `！付款`: 查詢付款資訊

### Event Handlers

#### 1. User Management (使用者管理)
當任何事件包含 `source.userId` 時，會自動觸發使用者管理流程：

**節點流程**:
1. `Check User Source` (If): 檢查是否有 `source.userId`
   - True → 進入使用者管理流程
   - False → 直接跳到 `Event Switch`（處理無使用者的事件）

2. `取得使用者表` (Notion GetAll): 查詢 USERS 資料庫中是否存在該 User ID
   - 使用 `alwaysOutputData: true` 確保空結果也會輸出

3. `Check User Exists` (Code): 判斷使用者是否存在
   - 檢查查詢結果是否有效（非空且包含 Notion page ID）
   - 取得當前的 `source.groupId` 和 `source.roomId`
   - 輸出：`userExists`, `userId`, `notionPageId`, `currentMessageCount`, `currentGroups`, `currentMultiChat`, `currentGroupId`, `currentRoomId`

4. `User Exists Switch` (If): 根據使用者是否存在分支
   - True → `Prepare Update Data` → `更新使用者`
   - False → `新增使用者`

5. `Prepare Update Data` (Code): 合併群組/聊天室資料（僅在更新時）
   - 取得現有的 `groups` 和 `multi-chat` 陣列
   - 如果有新的 `groupId`，加入 `groups`（去重）
   - 如果有新的 `roomId`，加入 `multi-chat`（去重）

6. `更新使用者` (Notion Update): 更新現有使用者
   - `message_counts` +1
   - `groups`: 更新後的群組列表
   - `multi-chat`: 更新後的聊天室列表

7. `新增使用者` (Notion Create): 建立新使用者
   - `user_id`: LINE User ID
   - `is_admin`: false
   - `message_counts`: 1
   - `groups`: 如果有 `groupId` 則設為 `[groupId]`，否則為空陣列
   - `multi-chat`: 如果有 `roomId` 則設為 `[roomId]`，否則為空陣列

8. `Merge User Management`: 合併兩個分支後繼續執行 `Event Switch`

**重要設計**:
- 使用者可能在多個群組/聊天室中與機器人互動，`groups` 和 `multi-chat` 會累積記錄所有互動的地點
- 一次只會更新 `groups` 或 `multi-chat` 其中之一（取決於訊息來源）
- 私訊不會更新這兩個欄位（保持原值）

**並行執行架構 (2026-01-11 更新)**:
- 使用者表更新流程與事件處理並行執行（非阻塞）
- `Check User Source` 的 output 0 (True) 同時連接到「取得使用者表」和「Event Switch」
- `Restore Original Event` 已不再連接到 `Event Switch`，成為使用者管理流程的終點
- Event Switch 不等待使用者表更新完成，立即開始處理事件
- 此設計優化了回應時間，但意味著使用者資料不會立即可用

**資料可用性**:
- 當事件觸發時，使用者表會非同步更新
- 需要使用者資料的功能必須明確查詢 USERS 資料庫
- 不要假設使用者管理流程在你的 handler 執行前已完成

**未來開發指引**:
- 若需使用使用者資料：在你的 handler 中新增明確的 USERS 資料庫查詢
- 不要修改使用者管理流程來新增功能依賴
- 保持使用者管理流程與業務邏輯隔離

#### 2. Admin Checking (2026-01-12 Update)
管理員權限檢查現已改為動態查詢 USERS 資料庫，替代過去的硬編碼 User ID 檢查。

**Command Path (is command = TRUE):**
1. `取得使用者表 (lazy)` (Notion Query): 查詢 USERS 資料庫以取得使用者的 `is_admin` 狀態
2. `Merge Admin Into Event` (Code): 將 `is_admin` 合併至事件資料（`_is_admin` 欄位）
3. `if this user is manager` (If): 檢查 `$json._is_admin === true`
   - TRUE → 執行 Manager rules + Command controller (管理員可用所有指令)
   - FALSE → 僅執行 Command controller (一般使用者僅可用普通指令)

**Auto Reply Path (is command = FALSE):**
1. `Check Admin Before Auto Reply` (Notion Query): 查詢使用者是否為管理員
2. `Extract Admin For Auto Reply` (Code): 提取 `is_admin` 並合併至事件
3. `Skip Auto Reply If Admin` (If): 檢查 `$json._is_admin === true` AND webhook URL 不包含 "webhook-test"
   - TRUE → 流程結束（管理員不觸發自動回覆）
   - FALSE → 繼續執行 `取得 auto reply message`（一般使用者觸發自動回覆，或測試 webhook）

**Edge Cases:**
- 若使用者不存在於資料庫：視為 `is_admin = false`（保守預設值）
- 若 `is_admin` 欄位為 null/undefined：視為 `false`（嚴格布林檢查）
- 使用 Lazy Loading 策略：僅在需要時查詢（節省 API 呼叫）
- **測試例外**: 若 webhook URL 包含 "webhook-test"，即使是管理員也會觸發自動回覆（方便測試）

#### 3. Join Event (加入事件)
當機器人被加入 `group` 或 `room` 時，會觸發 `取得歡迎訊息` 並回覆。

### Code Constants (Default Values)
- **Default Courts**: `2` (metadata node)
- **Default Price**: `170` (metadata node)
- **Courts Density**: `7` (players per court, defined in `下次打球 v2`)
- **Default Off Counts**: `0` (metadata node)
