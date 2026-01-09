# n8n Workflow & API Concepts

## Workflow JSON Structure

Here is an example of the n8n workflow JSON structure:

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "api/users"
      }
    }
  ],
  "connections": {}
}
```

## API Authentication

n8n uses API keys to authenticate API calls.

### Call the API using your key

```shell
# Get all active workflows
curl -X 'GET' \
  '<N8N_HOST>:<N8N_PORT>/api/v1/workflows?active=true' \
  -H 'accept: application/json' \
  -H 'X-N8N-API-KEY: <your-api-key>'

# Expected response:
{
  "data": [
    {
      "id": "123",
      "name": "My Workflow",
      "active": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

## Code Block Formatting

When writing code in nodes (e.g. Function/Code node) or documentation, use language-specific syntax highlighting:

```javascript
// JavaScript code with proper highlighting
const workflow = {
  nodes: [
    { name: 'Start', type: 'n8n-nodes-base.start' }
  ]
};
```

```python
# Python code example
import json

def process_data(items):
    return [item['value'] for item in items]
```

```bash
# Shell commands
npm install n8n -g
n8n start
```
