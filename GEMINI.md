# n8n JSON Workflow Guidelines

此資料夾專門用於存放與編輯 n8n 的 JSON 工作流檔案 (Workflow JSONs)。
為了確保 AI 協作的品質與檔案的正確性，請務必遵守以下規範。

## 核心規則 (Critical Rules)

1. **必讀文件**: 
   - 在編輯任何 n8n JSON 檔案之前，**必須** 閱讀並參考 `n8n-doc-for-ai.txt`。
   - 該檔案包含了 n8n 的文件說明與規範，是理解工作流結構的重要依據。

## 編輯與操作建議 (Operational Best Practices)

為了避免錯誤並提升維護性，建議遵守以下流程：

### 1. 安全與備份
- **備份優先**: 修改任何 `.json` 檔案前，請先建立備份副本 (例如 `cp Line bot.json Line bot.backup.json`)。
- **敏感資訊**: 嚴禁在 JSON 參數 (Parameters) 中直接寫死 API Keys、密碼或 Token。應使用 n8n 的 Credentials 機制或環境變數。

### 2. 結構與格式
- **JSON 驗證**: 完成編輯後，必須確保檔案是合法的 JSON 格式。遺漏逗號或括號會導致 n8n 無法匯入。
- **完整性**: 確保檔案保留核心結構：
  ```json
  {
    "nodes": [ ... ],
    "connections": { ... }
  }
  ```
- **節點命名**: 保持節點名稱具備語意 (例如使用 "Fetch User Data" 而非預設的 "HTTP Request")，這有助於 AI 理解邏輯連接。

### 3. 變更管理
- **原子化修改**: 如果要移除功能 (如重構)，建議分步驟進行，避免一次性刪除過多節點導致連接混亂。
- **清理孤立節點**: 移除功能後，請檢查是否有遺留的孤立節點 (Orphaned Nodes) 或無效的連接 (Dangling Connections)。

### 4. 版本控制
- 雖然 n8n 內部有版本紀錄，但建議在此資料夾中使用 Git 進行版本控制，撰寫清晰的 Commit Message (例如: `refactor: 移除 Gamification 相關節點`)。
