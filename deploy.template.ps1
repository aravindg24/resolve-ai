# Deploy script TEMPLATE for Resolve AI
# Copy this to deploy.ps1 and fill in your credentials

# Fix gcloud path if not found
$env:Path += ";C:\Users\YOUR_USERNAME\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin"

$PROJECT_ID = "YOUR_GCP_PROJECT_ID"
$SERVICE_NAME = "resolve-ai-service"
$REGION = "us-central1"

# Environment variables - REPLACE THESE WITH YOUR VALUES
$GEMINI_KEY = "YOUR_GEMINI_API_KEY"
$SUPABASE_URL = "YOUR_SUPABASE_URL"
$SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"

Write-Host "Building Docker image with build args..." -ForegroundColor Cyan
# Use Cloud Build config file to pass build args
$configContent = @"
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'VITE_SUPABASE_URL=$SUPABASE_URL'
      - '--build-arg'
      - 'VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY'
      - '-t'
      - 'gcr.io/$PROJECT_ID/resolve-ai'
      - '.'
images:
  - 'gcr.io/$PROJECT_ID/resolve-ai'
"@

# Write config file
$configContent | Out-File -FilePath "cloudbuild.yaml" -Encoding UTF8

# Submit build with config
gcloud builds submit --config=cloudbuild.yaml .

Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
    --image gcr.io/$PROJECT_ID/resolve-ai `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars "VITE_GEMINI_API_KEY=$GEMINI_KEY,VITE_SUPABASE_URL=$SUPABASE_URL,VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY"

Write-Host "Deployment complete!" -ForegroundColor Green
