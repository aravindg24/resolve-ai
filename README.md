# Resolve AI

**AI-Powered Repair Diagnostics System**

Resolve AI is a futuristic, web-based diagnostic tool designed to help users identify and fix repair issues using multimodal AI analysis. By leveraging the power of Google's Gemini models, it can analyze images and videos of broken items to provide step-by-step repair guides tailored to your skill level.

<div align="center">
<img width="1200" height="475" alt="Resolve AI Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Features

- **Multimodal Analysis**: Capture live photo/video or upload existing files to analyze problems.
- **Skill-Based Guidance**: Adjusts instructions based on your expertise (Novice, Intermediate, Expert).
- **Interactive Repair Steps**: Detailed, step-by-step repair instructions with safety warnings and tool requirements.
- **Cost & Time Estimation**: AI-generated estimates for repair costs and time.
- **Scan History**: deeply local storage of previous scans and analyses.
- **Cyberpunk UI**: A sleek, responsive interface with a futuristic aesthetic.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: TailwindCSS (Cyberpunk/Dark theme)
- **AI Integration**: Google Generative AI SDK (Gemini 1.5 Flash)
- **Icons**: Lucide React

## Run Locally

**Prerequisites:** Node.js (v18+)

1. **Clone the repository** (if applicable)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: Ensure you use `VITE_` prefix if accessible from client-side, or strictly follow the project's existing env handling if different. Based on code analysis, it uses `@google/genai` which might require specific setup, but standard Vite apps use `import.meta.env.VITE_...`)*

4. **Run the app**:
   ```bash
   npm run dev
   ```

## Usage

1. **Select Input**: Choose "Live Capture" to use your camera or "Upload Files" for existing images/videos.
2. **Describe Issue**: Enter a query like "How do I fix this?" (optional, defaults provided).
3. **Set Skill Level**: Toggle between Novice, Intermediate, or Expert.
4. **Analyze**: Click "Initialize Analysis" and wait for the AI to diagnose the issue.
5. **Review Results**: Follow the generated guide to perform your repair.
