# CODESWITCH.SYSTEMS

SPATIAL CANVAS FOR CODE-SWITCH®↗KUZI

## SETUP

### 1. NOTION API KEY
- Go to https://www.notion.so/my-integrations
- Click "New integration"
- Name it "CODESWITCH SYSTEMS"
- Select your workspace
- Copy the API key

### 2. CONNECT NOTION DATABASES
- Open each database in Notion (MODULES, DISCIPLINES, EXPLORATIONS, EXPERIMENTATIONS, MEDIA)
- Click the "..." menu in the top right of each database
- Click "Connections" → "Connect to" → select "CODESWITCH SYSTEMS"

### 3. ENVIRONMENT VARIABLES
- Copy `.env.local.example` to `.env.local`
- Paste your Notion API key
- Database IDs are already filled in

### 4. RUN LOCALLY
```
npm install
npm run dev
```
Open http://localhost:3000

### 5. DEPLOY TO VERCEL
- Push this project to GitHub
- Go to vercel.com
- Import the GitHub repository
- Add environment variables from .env.local
- Deploy

## CONTENT MANAGEMENT
All content is managed through Notion. Open the MEDIA database, add entries with images and metadata. The site updates automatically.
