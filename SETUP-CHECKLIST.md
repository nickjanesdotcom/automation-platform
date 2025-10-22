# Setup Checklist for Vercel Deployment

## ✅ Completed
- [x] Vercel deployment URL: `https://automation-platform-sigma.vercel.app/`
- [x] Notion Database ID: `ce5fcc18a78e4b3e97851cb9edd5d346`
- [x] Slack Channel ID: `C03AF1LJU4Q`

## 🔄 Still Needed

### 1. Notion Setup
- [ ] Verify database has these properties:
  - Name (Title)
  - Email (Email type) ⚠️ Must be Email type
  - Status (Select: new, accepted, rejected, scheduled, completed)
  - Company (Text)
  - Project Description (Text)
  - Budget (Number)
  - Timeline (Text)

- [ ] Get Notion API Key:
  1. Go to https://www.notion.so/my-integrations
  2. Create new integration or use existing
  3. Copy "Internal Integration Token" (starts with `secret_`)
  4. Add connection to your database (click "..." → Add connections)

### 2. Slack Setup
- [ ] Get Slack Bot Token:
  1. Go to https://api.slack.com/apps
  2. Create/select your app
  3. Go to "OAuth & Permissions"
  4. Add scopes: `chat:write`, `chat:write.public`
  5. Install to workspace
  6. Copy "Bot User OAuth Token" (starts with `xoxb-`)

- [ ] Get Slack Signing Secret:
  1. In your Slack app, go to "Basic Information"
  2. Under "App Credentials", copy "Signing Secret"

- [ ] Enable Interactivity:
  1. Go to "Interactivity & Shortcuts"
  2. Turn on Interactivity
  3. Set Request URL: `https://automation-platform-sigma.vercel.app/automations/lead-management/webhooks/slack`

### 3. Add to Vercel Environment Variables

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

```
NODE_ENV=production
NOTION_API_KEY=secret_xxxxx...
SLACK_BOT_TOKEN=xoxb-xxxxx...
SLACK_SIGNING_SECRET=xxxxx...
LEAD_ENABLED=true
LEAD_NOTION_DATABASE_ID=ce5fcc18a78e4b3e97851cb9edd5d346
LEAD_SLACK_CHANNEL_ID=C03AF1LJU4Q
LEAD_CALCOM_LINK=https://cal.com/your-username/call (optional for now)
```

### 4. Redeploy
After adding environment variables, Vercel will automatically redeploy.

## Testing

Once deployed, test with:

```bash
curl https://automation-platform-sigma.vercel.app/

# Should return JSON with status "ok"
```

Then test lead creation:

```bash
curl -X POST https://automation-platform-sigma.vercel.app/automations/lead-management/webhooks/gmail \
  -H "Content-Type: application/json" \
  -d @test-lead.json
```

Check:
1. Notion - new lead should appear
2. Slack channel - notification should appear with buttons
