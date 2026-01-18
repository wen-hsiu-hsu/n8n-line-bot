#!/usr/bin/env node

/**
 * Notion Database Schema Updater
 *
 * 此腳本會：
 * 1. 從 .env 讀取 NOTION_TOKEN
 * 2. 打 Notion API 取得 database schema
 * 3. 更新 docs/notion/database-schema.md
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
    purpose: '成員管理'
  },
  'Season Rental Record': {
    id: '7deede34-579d-4c77-b79b-20b9f4f000e7',
    name: '季租承租紀錄',
    purpose: '季度報名記錄'
  },
  'Calendar': {
    id: '0fd76b77-9f07-4aa3-a3c9-12ba18dbe32e',
    name: '行事曆',
    purpose: '打球日程'
  },
  'All Announcements': {
    id: '2e24dbf2-e21c-80b7-83f6-ef99c1dd9425',
    name: '所有公告',
    purpose: '公告模板'
  },
  'TEXT_REPLY': {
    id: '2e34dbf2-e21c-8047-8ac5-fccfc5c02729',
    name: 'TEXT_REPLY',
    purpose: '自動回覆規則'
  },
  'USERS': {
    id: '2e44dbf2-e21c-80d1-af81-c3b61579b3bb',
    name: 'USERS',
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
        type: config.type || 'dual_property'
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

// Convert database schema to markdown
function schemaToMarkdown(schema, dbConfig) {
  const properties = schema.properties;
  const timestamp = new Date().toISOString();

  let markdown = `### ${dbConfig.name}\n\n`;
  markdown += `**Database ID**: \`${schema.id}\`\n\n`;
  markdown += `**最後更新**: ${timestamp}\n\n`;

  if (dbConfig.name === '所有公告') {
    markdown += `> **注意**: 此 database 包含特殊 pages（\`NEWS_TEMPLATE\`, \`PAYMENT\`, \`WELCOME_MESSAGE\`），其內容儲存於 Child Blocks。\n\n`;
  }

  markdown += `#### Properties\n\n`;
  markdown += `| Property Name | Type | Configuration |\n`;
  markdown += `|--------------|------|---------------|\n`;

  for (const [propName, propData] of Object.entries(properties)) {
    const type = propData.type;
    const config = formatPropertyConfig(propData);
    const configStr = config ? `<pre>${JSON.stringify(config, null, 2)}</pre>` : '-';

    markdown += `| \`${propName}\` | ${type} | ${configStr} |\n`;
  }

  markdown += `\n`;

  return markdown;
}

// Update the database-schema.md file
function updateSchemaFile(dbKey, markdown) {
  const schemaFilePath = path.join(__dirname, '..', 'docs', 'notion', 'database-schema.md');

  if (!fs.existsSync(schemaFilePath)) {
    throw new Error('database-schema.md not found. Please create it first.');
  }

  let content = fs.readFileSync(schemaFilePath, 'utf8');

  // Update last update time in header
  const now = new Date().toISOString();
  content = content.replace(
    /\*\*最後更新時間\*\*: .*/,
    `**最後更新時間**: ${now}`
  );

  // Find the section for this database
  const dbConfig = DATABASES[dbKey];
  const sectionRegex = new RegExp(
    `### \\d+\\. ${dbConfig.name}[\\s\\S]*?(?=\\n---\\n|$)`,
    'g'
  );

  // Replace the section
  const sectionNumber = Object.keys(DATABASES).indexOf(dbKey) + 1;
  const newSection = `### ${sectionNumber}. ${dbConfig.name}\n\n${markdown}---\n`;

  if (content.match(sectionRegex)) {
    content = content.replace(sectionRegex, newSection);
  } else {
    console.warn(`Section for ${dbConfig.name} not found, appending to end.`);
    content += `\n${newSection}`;
  }

  // Update the table entry
  const tableRegex = new RegExp(
    `\\| ${dbConfig.name}[^|]*\\|[^|]*\\|[^|]*\\| - \\|`,
    'g'
  );
  content = content.replace(
    tableRegex,
    `| ${dbConfig.name} (${dbKey}) | \`${dbConfig.id}\` | ${dbConfig.purpose} | ${now} |`
  );

  fs.writeFileSync(schemaFilePath, content, 'utf8');
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting Notion Database Schema Update...\n');

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
    for (const dbKey of databasesToUpdate) {
      const dbConfig = DATABASES[dbKey];
      console.log(`  • ${dbConfig.name} (${dbKey})`);

      try {
        const schema = await fetchDatabaseSchema(dbConfig.id, notionToken);
        const markdown = schemaToMarkdown(schema, dbConfig);
        updateSchemaFile(dbKey, markdown);
        console.log(`    ✅ Updated successfully`);
      } catch (error) {
        console.error(`    ❌ Failed: ${error.message}`);
      }
    }

    console.log('\n✨ Schema update completed!\n');
    console.log('📄 Updated file: docs/notion/database-schema.md\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
