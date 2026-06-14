#!/usr/bin/env bash
#
# deploy_amplify.sh — Build and deploy the frontend to AWS Amplify
#
# Safeguards:
#   - Moves .env.local aside so .env.production values are used
#   - Verifies no localhost URLs leaked into the production bundle
#   - Zips build contents at the archive root (not inside build/)
#   - Deploys via Amplify create-deployment API (boto3)
#
# Prerequisites:
#   - AWS credentials set in environment (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
#     and optionally AWS_SESSION_TOKEN for SSO/assumed-role sessions)
#   - pip install boto3 requests (in the active venv or globally)
#
# Usage:
#   ./deploy_amplify.sh              # deploy to staging (serves asksaividya.com)
#   ./deploy_amplify.sh master       # deploy to master branch

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

BRANCH="${1:-staging}"
AMPLIFY_APP_ID="d1rpttzid1oy3c"
REGION="us-east-1"

echo "==> Frontend deploy to Amplify"
echo "    branch : $BRANCH"
echo "    app    : $AMPLIFY_APP_ID"
echo

# ---------------------------------------------------------------------------
# Step 1: Move .env.local aside so .env.production takes effect
# ---------------------------------------------------------------------------
MOVED_ENV_LOCAL=false
if [[ -f .env.local ]]; then
  echo "==> Moving .env.local aside (CRA gives it higher precedence than .env.production)"
  mv .env.local .env.local.bak
  MOVED_ENV_LOCAL=true
fi

# Restore .env.local on exit (success or failure)
restore_env_local() {
  if [[ "$MOVED_ENV_LOCAL" == "true" && -f .env.local.bak ]]; then
    mv .env.local.bak .env.local
    echo "==> Restored .env.local"
  fi
}
trap restore_env_local EXIT

# ---------------------------------------------------------------------------
# Step 2: Build
# ---------------------------------------------------------------------------
echo "==> Building production bundle..."
npm run build

# ---------------------------------------------------------------------------
# Step 3: Verify no localhost URLs in the bundle
# ---------------------------------------------------------------------------
echo "==> Checking for localhost API URLs in build..."
if grep -l "localhost:8000" build/static/js/*.js 2>/dev/null; then
  echo
  echo "ERROR: localhost:8000 (backend URL) found in production build. Aborting."
  echo "       Check .env.production and make sure REACT_APP_BASE_API_SERVER"
  echo "       and REACT_APP_API_URL point to the production API Gateway."
  exit 1
fi
echo "    No localhost API URLs found — safe to deploy."

# ---------------------------------------------------------------------------
# Step 4: Zip from inside build/ (Amplify expects files at archive root)
# ---------------------------------------------------------------------------
echo "==> Creating deploy zip..."
DEPLOY_ZIP="$(mktemp /tmp/amplify-deploy-XXXXXX.zip)"
( cd build && zip -r "$DEPLOY_ZIP" . -x "*.DS_Store" > /dev/null )
echo "    $DEPLOY_ZIP ($(du -h "$DEPLOY_ZIP" | cut -f1) compressed)"

# ---------------------------------------------------------------------------
# Step 5: Deploy to Amplify via boto3
# ---------------------------------------------------------------------------
echo "==> Deploying to Amplify ($BRANCH)..."
python3 - "$AMPLIFY_APP_ID" "$BRANCH" "$DEPLOY_ZIP" "$REGION" << 'PYTHON'
import boto3, requests, sys, time

app_id, branch, zip_path, region = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]

session = boto3.Session(region_name=region)
amplify = session.client('amplify')

# Create deployment
deployment = amplify.create_deployment(appId=app_id, branchName=branch)
job_id = deployment['jobId']
print(f"    Job ID: {job_id}")

# Upload
with open(zip_path, 'rb') as f:
    resp = requests.put(deployment['zipUploadUrl'], data=f,
                        headers={'Content-Type': 'application/zip'})
if resp.status_code != 200:
    print(f"ERROR: Upload failed with status {resp.status_code}")
    sys.exit(1)
print("    Upload complete.")

# Start deployment
amplify.start_deployment(appId=app_id, branchName=branch, jobId=job_id)

# Poll until done
for _ in range(60):
    job = amplify.get_job(appId=app_id, branchName=branch, jobId=job_id)
    status = job['job']['summary']['status']
    if status == 'SUCCEED':
        print(f"    Deploy succeeded.")
        sys.exit(0)
    elif status in ('FAILED', 'CANCELLED'):
        print(f"ERROR: Deploy {status}.")
        sys.exit(1)
    time.sleep(5)

print("ERROR: Deploy timed out.")
sys.exit(1)
PYTHON

# ---------------------------------------------------------------------------
# Step 6: Cleanup
# ---------------------------------------------------------------------------
rm -f "$DEPLOY_ZIP"

echo
echo "==> Done. Site live at https://asksaividya.com"
