#!/bin/bash
cd /data/.openclaw/workspace/coding-system/repos/osion-load-pilot

# Set environment variables
vercel env add OPENAI_API_KEY production --token "$VERCEL_TOKEN" << 'EOF'
sk-proj-MEwA
EOF

vercel env add OPENAI_MODEL production --token "$VERCEL_TOKEN" << 'EOF'
gpt-5.4-mini
EOF

# Redeploy
vercel --prod --yes --token "$VERCEL_TOKEN"
