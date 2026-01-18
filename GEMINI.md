# n8n Project Guidelines

此資料夾包含 n8n Line Bot 的專案文件與工作流。
為了確保開發效率與 Token 節省，請嚴格遵守以下文件閱讀與維護規範。

## 📁 文件結構與閱讀規範 (Documentation Protocol)

所有說明文件皆已模組化存放於 `docs/` 目錄。**請勿**一次讀取所有文件。僅根據當前任務需求讀取特定檔案。

### 1. LINE API 相關 (`docs/line/`)
- **Messaging API**: `1-reply-api.md` (回覆), `2-webhook-events.md` (事件), `3-message-objects.md` (訊息格式)
- **其他功能**: `4-quick-reply.md`, `5-implementation-examples.md`
- **參考**: `6-reference.md` (錯誤碼、最佳實踐)
- **Webhook 範例**: `7-webhook-message-example.md` (使用者訊息), `8-webhook-memberjoined-example.md` (成員加入), `9-webhook-unsend-example.md` (訊息收回)
- **使用時機**: 當需要查詢特定 LINE API 格式或 webhook 事件結構時，僅讀取對應檔案。開發前必須先讀取相關的 webhook 範例以了解完整結構。

### 2. n8n 相關 (`docs/n8n/`)
- **核心概念**: `n8n-concepts.md` (包含 Workflow JSON 結構範例、API 驗證)
- **常見錯誤**: `common-errors.md` (開發前必讀，包含 Luxon、換行轉義等雷點)
- **封存資料**: `archive-n8n-docs-repo.md` (原始龐大文件，除非 `concepts.md` 資訊不足，否則**不要讀取**)

### 3. Notion API 相關 (`docs/notion/`)
- **Database Schema** (自動產生):
  - `database-schema.md`: 所有 Notion Database 的欄位定義、型別、設定（**由腳本自動更新，不要手動編輯**）
  - `AI-SCHEMA-UPDATE-GUIDE.md`: AI 如何更新 schema 的完整指南（**開發 Notion 相關功能前必讀**）
  - **更新指令**: `node scripts/update-notion-schema.js` (詳見 `scripts/README.md`)
- **Block API**:
  - `2-block-base.md` (必讀), `1-block-structure.md` (n8n 簡化版)
  - `3-text-blocks.md`, `4-list-blocks.md`, `5-media-blocks.md`, `6-structural-blocks.md`
- **使用時機**:
  - 開發涉及 Notion 的新功能**之前**，執行 schema 更新腳本
  - 處理 Notion Block Children 或公告內容時讀取 Block API 文件

### 4. 專案背景 (`docs/project/`)
- **上下文**: `context.md` (記錄**商業邏輯**、資料流程、常數)
  - **不再包含**: Database 欄位定義（已移至 `docs/notion/database-schema.md`）
  - **僅包含**: Database 用途說明、Event Handlers 流程、Commands 列表、System Constants
- **使用時機**: 當需要理解「為什麼這樣設計」、「資料如何流動」、「有哪些指令」時讀取。

---

## ⚠️ 核心開發規則 (Core Development Rules)

1. **Token 節省 (Token Efficiency)**:
   - **禁止**無差別讀取整個 `docs/` 資料夾。
   - 修正 Bug 前，先檢查 `docs/n8n/common-errors.md` 是否已有案例。

2. **文件維護 (Documentation Maintenance)**:
   - **Notion Schema 更新**:
     - 開發涉及 Notion 的新功能**之前**，執行 `node scripts/update-notion-schema.js` 更新 schema
     - 使用者提到「我在 Notion 新增了欄位」時，**立即**執行 schema 更新腳本
     - **不要**手動編輯 `docs/notion/database-schema.md` 的 schema 部分
   - **商業邏輯維護**:
     - `docs/project/context.md` 記錄商業邏輯，與 `Line bot.json` 保持同步
     - 新增 Command、修改 Event Handler 流程時，**必須**更新 `context.md`
     - **不要**在 `context.md` 記錄 database 欄位定義（改用 schema 更新腳本）
   - **錯誤收錄**: 修復棘手 Bug 後，**主動詢問**是否收錄至 `docs/n8n/common-errors.md`。

3. **預設目標**:
   - 若未指定檔案，預設修改 `Line bot.json`。
   - 修改前**必須**建立備份 (e.g., `cp "Line bot.json" "Line bot.backup.json"`).

4. **Git Commit**:
   - 完成工作後，主動詢問是否 Commit。
   - Commit Message 需遵守 Conventional Commits (參考 User Rules)。

## 🛠 編輯建議 (Best Practices)

- **JSON 完整性**: 確保編輯後的 JSON 結構正確 (`{ "nodes": [], "connections": {} }`)。
- **節點命名**: 使用具語意的名稱 (如 "Fetch User Profile")，而非預設名稱。
- **敏感資訊**: 嚴禁在 JSON 中寫死 Token/Password，請使用 Credentials 或環境變數。
