# n8n Project Guidelines

此資料夾包含 n8n Line Bot 的專案文件與工作流。
為了確保開發效率與 Token 節省，請嚴格遵守以下文件閱讀與維護規範。

## 📁 文件結構與閱讀規範 (Documentation Protocol)

所有說明文件皆已模組化存放於 `docs/` 目錄。**請勿**一次讀取所有文件。僅根據當前任務需求讀取特定檔案。

### 1. LINE API 相關 (`docs/line/`)
- **Messaging API**: `1-reply-api.md` (回覆), `2-webhook-events.md` (事件), `3-message-objects.md` (訊息格式)
- **其他功能**: `4-quick-reply.md`, `5-implementation-examples.md`
- **參考**: `6-reference.md` (錯誤碼、最佳實踐)
- **使用時機**: 當需要查詢特定 LINE API 格式（如 Quick Reply JSON 結構）時，僅讀取對應檔案。

### 2. n8n 相關 (`docs/n8n/`)
- **核心概念**: `n8n-concepts.md` (包含 Workflow JSON 結構範例、API 驗證)
- **常見錯誤**: `common-errors.md` (開發前必讀，包含 Luxon、換行轉義等雷點)
- **封存資料**: `archive-n8n-docs-repo.md` (原始龐大文件，除非 `concepts.md` 資訊不足，否則**不要讀取**)

### 3. 專案背景 (`docs/project/`)
- **上下文**: `context.md` (記錄資料庫 Schema、常數、ID)
- **使用時機**: 當 JSON 中出現看不懂的 ID 或邏輯，或需要新增資料庫欄位時讀取。

---

## ⚠️ 核心開發規則 (Core Development Rules)

1. **Token 節省 (Token Efficiency)**:
   - **禁止**無差別讀取整個 `docs/` 資料夾。
   - 修正 Bug 前，先檢查 `docs/n8n/common-errors.md` 是否已有案例。

2. **文件維護 (Documentation Maintenance)**:
   - **新增知識**: 若發現新的資料庫欄位或商業邏輯，**必須**更新 `docs/project/context.md`。
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
