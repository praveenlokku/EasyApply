# Vercel Deployment Guide

## Environment Variables

Set these environment variables in your Vercel dashboard:

### Optional AI Service Keys
- `GEMINI_API_KEY` - Your Google Gemini API key (optional, app uses mock services if not provided)
- `OPENAI_API_KEY` - Your OpenAI API key (optional, app uses mock services if not provided)

### Optional Database
- `DATABASE_URL` - Your PostgreSQL database URL (optional, app uses in-memory storage if not provided)

### Required
- `NODE_ENV` - Set to `production` (automatically set by Vercel)

## Deployment Steps

1. **Push your code to GitHub** (already done)

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your EasyApply repository

3. **Configure Build Settings:**
   - Framework Preset: Other
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Set Environment Variables:**
   - In Vercel dashboard, go to Settings > Environment Variables
   - Add the variables listed above (optional ones can be left empty)

5. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

## Features

Your deployed app will include:
- ✅ Full-stack React + Express application
- ✅ Resume analysis with AI (Gemini/OpenAI or mock services)
- ✅ Job matching functionality
- ✅ User authentication
- ✅ Responsive design
- ✅ All your recent changes (no navbar, highlighted button, dashboard image)

## Notes

- The app works perfectly without any API keys (uses mock services)
- Database is optional (uses in-memory storage by default)
- All your recent UI changes are included in the deployment
