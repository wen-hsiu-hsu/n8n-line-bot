# Scripts Documentation

此資料夾包含專案的自動化腳本。

## update-notion-schema.js

### 功能
自動更新 Notion Database Schema 到 `docs/notion/database-schema.md`。

### 環境需求
- Node.js 18+ (使用內建 fetch API)
- `.env` 檔案包含 `NOTION_TOKEN`

### 設定步驟

1. 建立 `.env` 檔案（如果尚未存在）：
   ```bash
   touch .env
   ```

2. 在 `.env` 中加入 Notion Integration Token：
   ```env
   NOTION_TOKEN=secret_your_notion_integration_token
   ```

   > **如何取得 Notion Token**:
   > 1. 前往 [Notion Integrations](https://www.notion.so/my-integrations)
   > 2. 選擇或建立一個 Integration
   > 3. 複製 "Internal Integration Token"
   > 4. 確保 Integration 有權限存取專案中的所有 Databases

### 使用方法

```bash
# 更新所有 databases
node scripts/update-notion-schema.js

# 更新特定 database
node scripts/update-notion-schema.js --db "USERS"

# 更新多個 databases
node scripts/update-notion-schema.js --db "USERS,TEXT_REPLY"
```

### 可用的 Database Names
- `USERS`
- `TEXT_REPLY`
- `People List`
- `Season Rental Record`
- `Calendar`
- `All Announcements`

### 輸出範例

成功執行：
```
🚀 Starting Notion Database Schema Update...

✅ Loaded NOTION_TOKEN from .env

📊 Updating 1 database(s):

  • USERS (USERS)
    ✅ Updated successfully

✨ Schema update completed!

📄 Updated file: docs/notion/database-schema.md
```

### 常見錯誤

#### Error: .env file not found
**解決方法**: 在專案根目錄建立 `.env` 檔案並加入 `NOTION_TOKEN`

#### Error: NOTION_TOKEN not found in .env file
**解決方法**: 確認 `.env` 中包含 `NOTION_TOKEN=secret_...` 這一行

#### Failed to fetch database: 404
**解決方法**: Database ID 可能已變更，請檢查 `scripts/update-notion-schema.js` 中的 `DATABASES` 設定

#### Failed to fetch database: 401 Unauthorized
**解決方法**:
1. 檢查 Notion Token 是否正確
2. 確認 Integration 有權限存取該 Database

### AI 使用指南

詳細的 AI 操作指南請參考 `docs/notion/AI-SCHEMA-UPDATE-GUIDE.md`。
