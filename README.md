# 🛡️ GazeGuard – Intelligent Phishing Risk Detection System

GazeGuard is an intelligent browser-based phishing risk detection system that combines **eye-tracking**, **behavioural analysis**, and **large language models** to protect users from deceptive online content.

<div align="center">

![GazeGuard Logo](https://img.shields.io/badge/gazeguard-FFD700?style=for-the-badge&logo=multisim&logoSize=auto)


[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%235FA04E?logo=nodedotjs&logoSize=auto&logoColor=white)](https://nodejs.org)
![Express](https://img.shields.io/badge/Express-%23000000?logo=express&logoSize=auto)
![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248?logo=mongodb&logoColor=white&logoSize=auto)
![Mongoose](https://img.shields.io/badge/Mongoose-%23880000?logo=mongoosedotws&logoSize=auto)
![Clerk Authentication](https://img.shields.io/badge/Clerk-%236C47FF?logo=clerk&logoSize=auto)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
![Webgazer](https://img.shields.io/badge/Webgazer-%23DD344C?logoSize=auto)
![Chrome Extension APIs](https://img.shields.io/badge/Chrome%20Extension%20APIs-%23FF4F00?logoSize=auto)
![Hugging Face](https://img.shields.io/badge/Hugging%20Face-%23FFD21E?logo=huggingface&logoColor=8B8000&logoSize=auto)

</div>

---

## 📊 Project Stats

<div align="center">

| Metric | Value |
|--------|-------|
| Architecture | Chrome Extension + Backend API |
| Backend APIs | 3 Core Endpoints |
| Database | MongoDB (2 Primary Collections) |
| Authentication | Clerk |
| Tracking Method | Webcam-based Eye Tracking |

</div>


#### 🔐 Core Features
- Real-time gaze tracking using WebGazer.js
- Detection of prolonged focus on suspicious text
- AI-based phishing risk classification
- Context-aware warning nudges
- Secure user authentication
- Risk history storage and retrieval

#### 🎥 Video Demo

<div align="center">
<a href="https://youtu.be/rorShOUaQEo" target="_blank">
  <img src="https://img.youtube.com/vi/rorShOUaQEo/0.jpg" alt="Watch the video" width="700" align-items="center" />
</a>
</div>

---

## 🚀 Installation & Configuration

#### 📋 Prerequisites
```bash
- Node.js (v18+)
- npm
- Google Chrome
- MongoDB Atlas Account
- Clerk Account
- OpenAI API Key
```

#### Installation Steps 

1️⃣ Clone the repository
```bash
git clone https://github.com/hirvaDhandhukia/GazeGuard.git
cd GazeGuard 
```

2️⃣ Create .env files inside directories:
Backend:
```bash
PORT=4000
MONGODB_URI=your_mongodb_connection_string
```

Frontend: 
```bash
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_FRONTEND_API=https://organic-monarch-your-frontend.clerk.accounts.dev/
CLERK_SECRET_KEY=your_clerk_secret_key
CRX_PUBLIC_KEY=your_clerk_crx_public_key
OPENAI_API_KEY=your_openai_api_key
BACKEND_URL=http://localhost:4000/api
USERS_ENDPOINT=/users
DATA_ENDPOINT=/llm/responses
DASHBOARD_ENDPOINT=/llm/history
```

3️⃣ Install dependencies for both Backend and Frontend: 
```bash
cd <frontend & backend>
npm install
```

4️⃣ Start the backend server: 
```bash
npm start
```

5️⃣ Build the frotend and upload 'dist' to chrome extensions 
```bash
npm run build 
```

--- 

## Database Schema & API List

### MongoDB Collections: 
Users 
```bash
{
"_id": "ObjectId",
"clerkUserId": "string",
"email": "string",
"createdAt": "date"
}
```
Risk Assessments 
```bash
{
"_id": "ObjectId",
"clerkUserId": "string",
"url": "string",
"focusedText": "string",
"riskLevel": "low | medium | high",
"llmResponse": "string",
"timestamp": "date"
}
```

### API Endpoints
```bash
POST /api/users
POST /api/llm/responses
GET /api/llm/history/:clerkUserId
```











