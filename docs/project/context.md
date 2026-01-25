# Project Context

此檔案記錄無法單純從代碼中完全推斷的專案背景資訊，包含**商業邏輯**、**資料流程**與**常數設定**。

> **📊 Database Schema 參考**:
> - 詳細的 database 欄位定義（Property names, types, configurations）請參考 `docs/notion/database-schema.md`
> - 如何更新 schema 請參考 `docs/notion/AI-SCHEMA-UPDATE-GUIDE.md`

---

## Notion Databases (Business Logic)

> [!NOTE]
> 詳細欄位定義、型別與 Schema 已移至 [database-schema.md](file:///Users/shiu/Documents/repos/n8n-line-bot/docs/notion/database-schema.md)。此處僅記錄各資料庫的用途與關鍵連結邏輯。

### 1. 人員清單 (People List)
- **用途**: 成員管理中心，記錄所有球員的姓名、繳費狀態與聯繫方式。
- **關鍵關聯**: 與 `USERS` 連結，將 LINE 使用者與 Notion 球員資料配對。

### 2. 季租承租紀錄 (Season Rental Record)
- **用途**: 記錄每一季（如 2025-Q1）的租借合約、場地數、固定報名名單、場租總額與零打定價。
- **關鍵關聯**: 透過「報名人」關聯至「人員清單」來定義該季的固定成員。

### 3. 行事曆 (Calendar)
- **用途**: 追蹤每週打球活動。包含日期、場地數變動、類型（打球/暫停）、請假名單與零打名額。
- **關鍵欄位**:
  - `請假人`: (Relation) 指向「人員清單」。
  - `零打`: (Multi-select) 記錄當週補位球員名單。

### 4. 所有公告 (All Announcements)
- **用途**: 儲存公告模板（如 `NEWS_TEMPLATE`, `PAYMENT`, `WELCOME_MESSAGE`），供 n8n 抓取內容並動態替換 Placeholder。

#### WELCOME_MESSAGE Placeholder 規則
當機器人被加入群組/聊天室時，會自動發送 `WELCOME_MESSAGE`，並替換以下 placeholders：

- `{NEW_FRIEND}`: 自動替換為加入群組的新成員（使用 LINE textV2 mention）
- `{MANAGER}`: 自動替換為管理員（動態查詢 USERS 資料庫中 `is_admin = true` 的使用者）

**實現方式**: 使用 LINE Messaging API **Text Message v2** 格式
- `type: "textV2"`
- 使用 `substitution` 物件定義 placeholder 的 mention 替換

#### INTRODUCE Placeholder 規則
當使用者輸入 `@Dobby` 時，會觸發自我介紹訊息，並替換以下 placeholders：

- `{USER}`: 自動替換為觸發指令的使用者（使用 LINE textV2 mention）
- `{MANAGER}`: 自動替換為管理員（硬編碼 ID: `U2a0a2c5054c4fa12b78a1d059411e39c`）

### 5. TEXT_REPLY (自動回覆)
- **用途**: 根據關鍵字觸發自動回覆訊息。
- **資料來源**: n8n Data Table (自 2026-01-24 起，從 Notion Database 遷移至 Data Table 以提升效能)
  - Data Table ID: `QzAIeJGMCaAgutGN`
  - 欄位結構: `message` (關鍵字), `reply` (回覆內容)
- **觸發邏輯**: 字串包含匹配（**區分大小寫**，`Line bot.json` 中直接使用 `includes()` 且未轉小寫）
- **效能優化**: 使用 Data Table 取代 Notion API 呼叫，減少回應延遲

### 6. USERS (使用者資料庫)
- **用途**: 追蹤所有 LINE 互動使用者，管理權限（`is_admin`）與累積訊息量。
- **資料來源對應**:
  - 群組訊息（`source.type = "group"`）→ 更新 `groups` 欄位（Multi-select）
  - 聊天室訊息（`source.type = "room"`）→ 更新 `multi-chat` 欄位（Multi-select）
  - 私訊（`source.type = "user"`）→ 兩個欄位都不更新
- **關鍵關聯**: `Registered name` (Relation) 用於確認該 LINE 使用者是否為「人員清單」中的正式球員。
- **自動更新欄位**:
  - `Custom Name`: 由子工作流透過 LINE API 取得 displayName 並更新
  - `message_counts`: 每次使用者發送訊息時自動 +1

---

## System Constants

### Manager Info
- **Admin Checking Method**: Dynamic check via USERS database `is_admin` field
- **Implementation**: Lazy-loaded Notion queries in command and auto reply paths
- ~~**Manager User ID**: `U2a0a2c5054c4fa12b78a1d059411e39c` (Deprecated - now using database)~~

### Commands (Defined in Command Controller)
- `@Dobby`: 觸發自我介紹 (Self Introduction)
- `@Dobby owe` / `@Dobby 欠`: 查詢未繳費名單
- `@Dobby command` / `@Dobby 指令`: 查詢指令列表
- `@Dobby participants` / `@Dobby people` / `@Dobby 報名人`: 查詢季度報名人 (可選參數: `e.g. @Dobby participants 2025-Q1`)
- `@Dobby next` (Admin only): 下一次通知
- `@Dobby news` / `@Dobby 公告`: 查詢最新公告
- `@Dobby payment` / `@Dobby 付款`: 查詢付款資訊 (支援顯示 bulleted list 項目)
- `@Dobby +1`: 報名零打（自己）。如果是季租球員，則報名一個「朋友」。重複`+1`會自動以 `+2`, `+3` 格式處理。
- `@Dobby +2`: 報名兩個零打。
- `@Dobby -1`: 取消報名。
- `@Dobby 假`: 季租球員請假。系統會立即扣除請假人數並釋出名額（使用 Post-Update Calculation）。
- `@Dobby 銷假`: 季租球員取消請假。
- `@Dobby {Name} {Command}`: (管理員) 代他人操作（Name 必須以 `@` 開頭，例如 `@Dobby @Vic 假`）。

### Leave Policy (請假規則)
- **資格限制**: 僅限該季度的 **季租球員 (Season Players)** 使用。非季租球員（或未被連結至人員清單的使用者）無法請假。
- **狀態檢查 (Idempotency)**:
  - 若已請假，再次輸入 `@Dobby 假` 會回傳錯誤提示（避免重複計算）。
  - 若未請假，輸入 `@Dobby 銷假` 會回傳錯誤提示。
- **名額釋出機制**:
  - 請假成功後，系統會計算 `Total Capacity - (Season Members - Updated Leave List)`。
  - **零打名額 (Guest Slots)** 會立即增加，供其他人報名。
- **資料源**: 讀取並更新 Notion 行事曆當週頁面的 `請假人` (Relation) 欄位。

### Registration & Leave Redis Locking (2026-01-25)
為防止並發報名/請假操作導致 Notion 資料覆蓋，系統使用 **Redis 分散式鎖定機制**。

**鎖定機制**:
- **鎖定粒度**: Event Page 級別 (`notion:event:{eventPageId}:lock`)
- **實現方式**: 使用 Community Node `@codingfrog/n8n-nodes-redis-enhanced`
- **TTL**: 10 秒自動過期（防止死鎖）
- **行為**: 加鎖失敗時立即回覆「系統繁忙」，用戶需手動重試

**流程概要**:
```
Command controller (報名請假)
  → Extract Event Page ID
  → Redis Enhanced (SET NX with TTL=10)
  → Verify Lock & Check
  ├─ Success → Registration Parser → Update Notion → Release Lock
  └─ Failed → Reply "系統繁忙"
```

**詳細文件**: 完整的實現細節、節點配置、測試方法請參考 `docs/n8n/redis-locking.md`

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
   - `message_counts`: 若事件類型為 `message` 則 +1，否則維持原值
   - `groups`: 更新後的群組列表
   - `multi-chat`: 更新後的聊天室列表

7. `新增使用者` (Notion Create): 建立新使用者
   - `user_id`: LINE User ID
   - `is_admin`: false
   - `message_counts`: 若事件類型為 `message` 則設為 1，否則設為 0
   - `groups`: 如果有 `groupId` 則設為 `[groupId]`，否則為空陣列
   - `multi-chat`: 如果有 `roomId` 則設為 `[roomId]`，否則為空陣列

8. `Merge User Management`: 合併更新與新增兩個分支

9. `Call 'Notion Badminton update user display_name'` (Execute Workflow): 呼叫子工作流
   - 傳入 `group_id` 和 `user_id`
   - 更新使用者的顯示名稱 (Display Name)
   - 此流程為 side-effect，執行完畢後結束，不影響主事件處理

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
   - FALSE → 繼續執行 `Get auto reply rows` (Data Table 節點，取代過去的 Notion Database 查詢)
4. `Get auto reply rows` (Data Table): 從 n8n Data Table 取得所有自動回覆規則
   - 使用 Data Table 取代 Notion Database，避免外部 API 呼叫
   - 資料結構簡化為 `{ message, reply }`，無需複雜的巢狀屬性存取
5. `Auto Reply Message` (Code): 檢查使用者訊息是否包含任一關鍵字並組合回覆

**Edge Cases:**
- 若使用者不存在於資料庫：視為 `is_admin = false`（保守預設值）
- 若 `is_admin` 欄位為 null/undefined：視為 `false`（嚴格布林檢查）
- 使用 Lazy Loading 策略：僅在需要時查詢（節省 API 呼叫）
- **測試例外**: 若 webhook URL 包含 "webhook-test"，即使是管理員也會觸發自動回覆（方便測試）

#### 3. Join Event (加入事件)
當機器人被加入 `group` 或 `room` 時，會觸發 `取得歡迎訊息` 並回覆。

#### 4. Batch Update User Display Names (批次更新使用者顯示名稱) (2026-01-14)
**Workflow File**: `LineBot-Dobby-update-display_name.json`

獨立的手動觸發 workflow，用於批次更新 USERS 資料庫中所有使用者的 `Custom Name` 欄位。

**觸發方式**: 手動點擊 `Manual Trigger (Push Test)` 節點

**節點流程**:
1. **取得可更新的使用者** (Notion Query):
   - 查詢 USERS 資料庫
   - 篩選條件: `groups` 欄位不為空（有加入群組的使用者）
   - 輸出格式: Notion 簡化格式（`property_user_id`, `property_groups`, `id`）

2. **準備 API 資料** (Code):
   - 提取每個使用者的 `user_id`, `notion_page_id`, 以及第一個 `group_id`
   - 輸出格式: `{ user_id, group_id, notion_page_id, original_data }`

3. **呼叫 LINE API (Dobby)** (HTTP Request):
   - 使用 Line Dobby credentials
   - API: `GET https://api.line.me/v2/bot/group/{groupId}/member/{userId}`
   - 設定 `continueOnFail: true` 以處理 404 錯誤

4. **合併 Dobby API 結果** (Code):
   - 遍歷所有 HTTP 回應，與原始資料配對
   - 成功項目: 輸出 `{ id, display_name, user_id }` (Notion 更新格式)
   - 失敗項目: 輸出 `{ user_id, group_id, notion_page_id, error }` (保留以便重試)

5. **檢查 Dobby API 是否成功** (If):
   - 條件: `display_name` 不為空
   - True (成功) → 直接到「更新使用者 display_name」
   - False (失敗) → 到「呼叫 LINE API (球來就打)」

6. **呼叫 LINE API (球來就打)** (HTTP Request):
   - 使用 Line 球來就打 credentials
   - 對失敗的使用者重試同一個 API
   - 設定 `continueOnFail: true`

7. **合併球來就打 API 結果** (Code):
   - 處理重試的 HTTP 回應
   - 成功項目: 輸出 `{ id, display_name, user_id }` (Notion 更新格式)
   - 失敗項目: 跳過（兩個 bot 都失敗，不更新）
   - 使用 `$('檢查 Dobby API 是否成功', 1).all()` 取得 False 分支的原始資料

8. **更新使用者 display_name** (Notion Update):
   - 接收兩個分支的成功項目
   - 批次更新 USERS 資料庫的 `Custom Name` 欄位

**設計特點**:
- **雙 Bot 策略**: 使用兩個不同的 LINE Bot credentials 最大化成功率
- **並行更新**: 兩個分支都直接連接到 Notion Update 節點，提高效率
- **容錯處理**: 使用 `continueOnFail` 確保部分失敗不影響整體執行
- **資料完整性**: 只更新成功取得 displayName 的使用者

**資料流**:
```
Notion USERS (有 groups 的使用者)
  ↓
準備 API 資料 (提取 user_id, group_id, notion_page_id)
  ↓
呼叫 LINE API (Dobby) → 合併結果 → IF 檢查
  ├─ 成功 ─────────────────────┐
  └─ 失敗 → LINE API (球來就打) ├─→ 更新 Notion Custom Name
           → 合併結果 ───────────┘
```

**注意事項**:
- 使用者必須在 `groups` 欄位中有群組 ID 才能被更新（因為 API 需要 groupId）
- 如果使用者已離開群組，兩個 API 都會返回 404，該使用者不會被更新
- `Custom Name` 欄位會被覆蓋為 LINE 上的最新 displayName

#### 5. Scheduled Message Workflow (排程推播) (2026-01-22)
**Workflow File**: `LineBot-Dobby-scheduled-message.json`

獨立的排程工作流，每週定期推播打球資訊。

**觸發方式**: 
- `Schedule Trigger`: 每週特定時間觸發
- `Manual Trigger`: 手動測試用

**主要功能**:
- 檢查本週打球狀態（是否暫停）
- 計算剩餘零打名額
- 推播訊息至 LINE 群組（包括 Dobby 和球來就打）

**流程簡介**:
1. `Set Environment`: 設定 Production/Test 環境變數
2. `metadata (Push)`: 計算下週六日期、季度資訊
3. `取得該季資訊`: 從 Notion 取得季度費用、預設場地
4. `取得打球日`: 確認是否有當週活動頁面
5. `Get People Next`: 取得人員名單以解析請假者姓名
6. `下次打球 v2`: 組合推播訊息文字（計算缺席、零打名額）
7. `push Dobby` / `push 球來就打`: 發送 LINE Push Message

---

### Code Constants (Default Values)
- **Default Courts**: `2` (metadata node)
- **Default Price**: `170` (metadata node)
- **Courts Density**: `7` (players per court, defined in `下次打球 v2`)
- **Default Off Counts**: `0` (metadata node)
