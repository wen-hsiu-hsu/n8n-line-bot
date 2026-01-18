#!/usr/bin/env node

/**
 * Notion Database Schema Updater (JSON Version)
 *
 * 此腳本會：
 * 1. 從 .env 讀取 NOTION_TOKEN
 * 2. 打 Notion API 取得 database schema
 * 3. 為每個 database 產生獨立的 JSON schema 檔案到 docs/notion/schemas/
 * 4. 產生 index.json 列出所有 databases
 * 5. 更新 database-schema.md 導覽文件
 *
 * Usage:
 *   node scripts/update-notion-schema.js                    # 更新所有 databases
 *   node scripts/update-notion-schema.js --db "USERS"       # 更新特定 database
 *   node scripts/update-notion-schema.js --db "USERS,TEXT_REPLY"  # 更新多個 databases
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules __dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configurations
const DATABASES = {
  'People List': {
    id: '252f388d-4ac7-49a4-82ae-a7f18044f701',
    name: '人員清單',
    name_en: 'People List',
    filename: 'people-list.json',
    purpose: '管理羽球社團成員名單，追蹤繳費狀態'
  },
  'Season Rental Record': {
    id: '7deede34-579d-4c77-b79b-20b9f4f000e7',
    name: '季租承租紀錄',
    name_en: 'Season Rental Record',
    filename: 'season-rental-record.json',
    purpose: '記錄每季的場地承租資訊、報名人數、費用計算'
  },
  'Calendar': {
    id: '0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e',
    name: '行事曆',
    name_en: 'Calendar',
    filename: 'calendar.json',
    purpose: '記錄每次打球的日期、請假人、場地數量'
  },
  'All Announcements': {
    id: '2e24dbf2-e21c-80b7-83f6-ef99c1dd9425',
    name: '所有公告',
    name_en: 'All Announcements',
    filename: 'all-announcements.json',
    purpose: '儲存公告模板與歡迎訊息的 Child Blocks'
  },
  'TEXT_REPLY': {
    id: '2e34dbf2-e21c-8047-8ac5-fccfc5c02729',
    name: 'TEXT_REPLY',
    name_en: 'TEXT_REPLY',
    filename: 'text-reply.json',
    purpose: '自動回覆規則'
  },
  'USERS': {
    id: '2e44dbf2-e21c-80d1-af81-c3b61579b3bb',
    name: 'USERS',
    name_en: 'USERS',
    filename: 'users.json',
    purpose: '使用者追蹤'
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const dbArg = args.find(arg => arg.startsWith('--db=') || arg === '--db');

  if (dbArg) {
    const nextArgIndex = args.indexOf(dbArg) + 1;
    const dbNames = dbArg.startsWith('--db=')
      ? dbArg.split('=')[1]
      : args[nextArgIndex];

    if (dbNames) {
      return dbNames.split(',').map(name => name.trim());
    }
  }

  return null; // null means update all databases
}

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found. Please create one with NOTION_TOKEN.');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  }

  if (!process.env.NOTION_TOKEN) {
    throw new Error('NOTION_TOKEN not found in .env file.');
  }
}

// Fetch database schema from Notion API
async function fetchDatabaseSchema(databaseId, notionToken) {
  const url = `https://api.notion.com/v1/databases/${databaseId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${notionToken}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch database ${databaseId}: ${response.status} ${error}`);
  }

  return await response.json();
}

// Format property configuration based on type
function formatPropertyConfig(property) {
  const type = property.type;
  const config = property[type];

  if (!config) return null;

  switch (type) {
    case 'select':
    case 'multi_select':
      if (config.options && config.options.length > 0) {
        return {
          options: config.options.map(opt => ({
            name: opt.name,
            color: opt.color
          }))
        };
      }
      return null;

    case 'relation':
      return {
        database_id: config.database_id,
        type: config.type || 'dual_property',
        synced_property_id: config.synced_property_id,
        synced_property_name: config.synced_property_name
      };

    case 'formula':
      return {
        expression: config.expression
      };

    case 'rollup':
      return {
        relation_property_name: config.relation_property_name,
        rollup_property_name: config.rollup_property_name,
        function: config.function
      };

    case 'number':
      return {
        format: config.format
      };

    default:
      return null;
  }
}

// Convert Notion schema to JSON format
function schemaToJSON(schema, dbConfig) {
  const properties = {};

  for (const [propName, propData] of Object.entries(schema.properties)) {
    properties[propName] = {
      type: propData.type,
      config: formatPropertyConfig(propData)
    };
  }

  return {
    id: schema.id,
    name: dbConfig.name,
    name_en: dbConfig.name_en,
    purpose: dbConfig.purpose,
    last_updated: new Date().toISOString(),
    properties: properties
  };
}

// Save schema as JSON file
function saveSchemaJSON(dbKey, schemaData) {
  const dbConfig = DATABASES[dbKey];
  const schemasDir = path.join(__dirname, '..', 'docs', 'notion', 'schemas');

  // Ensure schemas directory exists
  if (!fs.existsSync(schemasDir)) {
    fs.mkdirSync(schemasDir, { recursive: true });
  }

  const filePath = path.join(schemasDir, dbConfig.filename);
  fs.writeFileSync(filePath, JSON.stringify(schemaData, null, 2), 'utf8');

  return filePath;
}

// Generate index.json
function generateIndex(updatedDatabases) {
  const schemasDir = path.join(__dirname, '..', 'docs', 'notion', 'schemas');
  const indexPath = path.join(schemasDir, 'index.json');

  const index = {
    last_updated: new Date().toISOString(),
    databases: {}
  };

  for (const dbKey of Object.keys(DATABASES)) {
    const dbConfig = DATABASES[dbKey];
    index.databases[dbKey] = {
      id: dbConfig.id,
      name: dbConfig.name,
      name_en: dbConfig.name_en,
      purpose: dbConfig.purpose,
      filename: dbConfig.filename,
      path: `docs/notion/schemas/${dbConfig.filename}`
    };
  }

  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');
  return indexPath;
}

// Update database-schema.md navigation file
function updateNavigationFile() {
  const mdPath = path.join(__dirname, '..', 'docs', 'notion', 'database-schema.md');

  let content = `# Notion Database Schema Reference

> **⚠️ Auto-Generated File**: 此檔案為導覽文件，實際 schema 資料儲存在 JSON 檔案中。
>
> **最後更新時間**: ${new Date().toISOString()}

此檔案提供所有 Notion Database Schema 的導覽。每個 database 的詳細 schema 儲存在獨立的 JSON 檔案中。

---

## 為什麼使用 JSON 格式？

1. **結構化資料**: JSON 格式易於 AI 解析，提升閱讀準確度
2. **模組化**: 每個 database 獨立檔案，AI 只讀取需要的部分，節省 token
3. **程式化處理**: 容易被程式讀取和處理
4. **版本控制友好**: Git diff 更清晰

---

## 使用指南

### 1. 更新 Database Schema
當需要取得最新的 database schema 時，執行以下指令：

\`\`\`bash
# 更新所有 databases
node scripts/update-notion-schema.js

# 更新特定 database（透過 database name）
node scripts/update-notion-schema.js --db "USERS"

# 更新多個特定 databases
node scripts/update-notion-schema.js --db "USERS,TEXT_REPLY"
\`\`\`

### 2. 讀取 Schema（AI 使用）

\`\`\`javascript
// 使用 Read tool 讀取特定 database 的 schema
Read docs/notion/schemas/users.json

// 讀取 index 查看所有可用的 databases
Read docs/notion/schemas/index.json
\`\`\`

### 3. 環境變數設定
腳本會從 \`.env\` 讀取 \`NOTION_TOKEN\`，確保以下變數存在：

\`\`\`env
NOTION_TOKEN=secret_your_notion_integration_token
\`\`\`

---

## Database 清單

以下是所有 Notion Databases 的索引：

| Database Name | 檔案位置 | 用途 |
|--------------|---------|------|
`;

  for (const [dbKey, dbConfig] of Object.entries(DATABASES)) {
    content += `| ${dbConfig.name} (${dbConfig.name_en}) | [\`${dbConfig.filename}\`](schemas/${dbConfig.filename}) | ${dbConfig.purpose} |\n`;
  }

  content += `

---

## JSON Schema 格式說明

每個 database 的 JSON 檔案包含以下欄位：

\`\`\`json
{
  "id": "database_id",               // Notion Database ID
  "name": "人員清單",                 // 中文名稱
  "name_en": "People List",          // 英文名稱
  "purpose": "管理羽球社團成員...",   // 用途說明
  "last_updated": "2026-01-18...",   // 最後更新時間
  "properties": {                    // 所有欄位定義
    "Name": {
      "type": "title",               // 欄位型別
      "config": null                 // 型別特定設定（可為 null）
    },
    "結清": {
      "type": "formula",
      "config": {
        "expression": "..."          // Formula expression
      }
    }
  }
}
\`\`\`

### Property Types
- \`title\`: 標題欄位
- \`rich_text\`: 富文本
- \`number\`: 數字
- \`select\`: 單選（config 包含 options）
- \`multi_select\`: 多選（config 包含 options）
- \`checkbox\`: 勾選框
- \`relation\`: 關聯（config 包含 database_id）
- \`formula\`: 公式（config 包含 expression）
- \`rollup\`: 彙總
- \`date\`: 日期
- \`created_time\`: 建立時間
- \`files\`: 檔案

---

## 相關文件

- **AI 操作指南**: [\`AI-SCHEMA-UPDATE-GUIDE.md\`](AI-SCHEMA-UPDATE-GUIDE.md)
- **腳本說明**: [\`../../../scripts/README.md\`](../../../scripts/README.md)
- **商業邏輯**: [\`../project/context.md\`](../project/context.md)

---

## 注意事項

1. **不要手動編輯 JSON 檔案**: 所有 schema 檔案由腳本自動產生
2. **不要手動編輯此導覽檔**: \`database-schema.md\` 也由腳本自動產生
3. **商業邏輯分離**: 欄位的用途說明請記錄在 \`context.md\`
4. **定期更新**: 在 Notion 中修改 database 後，記得執行更新腳本
`;

  fs.writeFileSync(mdPath, content, 'utf8');
  return mdPath;
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Notion Database Schema Update (JSON Version)...\n');

    // Load environment variables
    loadEnv();
    const notionToken = process.env.NOTION_TOKEN;
    console.log('✅ Loaded NOTION_TOKEN from .env\n');

    // Parse arguments
    const targetDatabases = parseArgs();
    const databasesToUpdate = targetDatabases
      ? Object.keys(DATABASES).filter(key => targetDatabases.includes(key))
      : Object.keys(DATABASES);

    if (databasesToUpdate.length === 0) {
      console.error('❌ No matching databases found.');
      process.exit(1);
    }

    console.log(`📊 Updating ${databasesToUpdate.length} database(s):\n`);

    // Fetch and update each database
    const updatedFiles = [];
    for (const dbKey of databasesToUpdate) {
      const dbConfig = DATABASES[dbKey];
      console.log(`  • ${dbConfig.name} (${dbKey})`);

      try {
        const schema = await fetchDatabaseSchema(dbConfig.id, notionToken);
        const schemaJSON = schemaToJSON(schema, dbConfig);
        const filePath = saveSchemaJSON(dbKey, schemaJSON);
        updatedFiles.push(filePath);
        console.log(`    ✅ Saved to ${dbConfig.filename}`);
      } catch (error) {
        console.error(`    ❌ Failed: ${error.message}`);
      }
    }

    // Generate index.json
    console.log('\n📑 Generating index.json...');
    const indexPath = generateIndex(databasesToUpdate);
    console.log(`  ✅ Saved to index.json`);

    // Update navigation file
    console.log('\n📝 Updating navigation file...');
    const mdPath = updateNavigationFile();
    console.log(`  ✅ Updated database-schema.md`);

    console.log('\n✨ Schema update completed!\n');
    console.log(`📂 Updated files:\n`);
    updatedFiles.forEach(file => console.log(`  - ${path.basename(file)}`));
    console.log(`  - index.json`);
    console.log(`  - database-schema.md\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
