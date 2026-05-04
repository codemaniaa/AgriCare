🌾 AgriCare — Full Stack Agriculture Marketplace

AgriCare is a production-ready full-stack agriculture marketplace inspired by OLX, designed to connect farmers, buyers, and sellers through a modern, scalable web platform.

It combines secure authentication, real-time communication, and a powerful product marketplace into a single seamless experience.

---

🚀 Key Highlights

- 🔐 Secure Authentication (JWT + OTP Verification)
- 📦 Advanced Product Marketplace (filters, sorting, pagination)
- 💬 Real-time Chat System (WebSockets)
- 🧾 Order Management System (Buyer & Seller workflows)
- ⭐ Ratings & Reviews Engine
- 📊 Seller Dashboard with Analytics
- 📱 Fully Responsive (Mobile-first UI)
- ⚡ Optimized API performance with DRF

---

🧠 System Architecture

Frontend (React - Vercel)
        ↓ API Calls
Backend (Django REST - Railway)
        ↓
PostgreSQL Database
        ↓
Redis (WebSocket Channels)

---

🛠 Tech Stack

Frontend

- React.js (SPA Architecture)
- Axios (API Layer)
- Context API (State Management)
- Responsive UI (Mobile-first design)

Backend

- Django 4.2
- Django REST Framework
- Django Channels (WebSocket communication)
- JWT Authentication (SimpleJWT)

Database & Services

- PostgreSQL (Relational DB)
- Redis (Real-time messaging)

Deployment

- Frontend: Vercel
- Backend: Railway

---

📦 Core Modules

🔐 Authentication & Security

- JWT-based authentication (Access + Refresh tokens)
- Gmail OTP verification flow
- CNIC validation (Pakistan-specific identity check)
- Password validation & secure hashing

---

🛒 Marketplace Engine

- Product CRUD with multi-image upload
- Advanced filtering:
  - Category, price range, search
- Pagination & sorting
- Featured products system

---

💬 Real-Time Chat

- WebSocket-based communication
- Persistent chat history
- Token-based authentication in WebSocket
- Conversation management system

---

🧾 Order System

- “Buy Now” workflow
- Buyer & Seller dashboards
- Order status lifecycle management

---

📊 Dashboard & Analytics

- Seller earnings tracking
- Product performance insights
- Order statistics

---

⭐ Reviews & Ratings

- Star-based rating system
- Review text submission
- Average rating calculation

---

👤 User Profile

- Profile update (name, city, image)
- Password change system

---

📁 Project Structure

AgriCare/
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── manage.py
│   └── apps/
│       ├── users/
│       ├── products/
│       ├── orders/
│       └── chat/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── context/
│       └── api/
│
├── README.md
└── .gitignore

---

⚙️ Local Development Setup

1️⃣ Clone Repository

git clone https://github.com/your-username/agricare.git
cd agricare

---

2️⃣ Backend Setup

cd backend

python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env

Update ".env":

DJANGO_SECRET_KEY=your_secret
DEBUG=True
DB_NAME=agricare_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

Run:

python manage.py migrate
python manage.py runserver

---

3️⃣ Frontend Setup

cd frontend

npm install
npm start

---

🔐 Environment Configuration

Backend ("backend/.env")

DJANGO_SECRET_KEY=your_secret_key
DEBUG=False

DB_NAME=your_db
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=your_host
DB_PORT=5432

EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password

---

🌐 Live Deployment

- Frontend: https://your-app.vercel.app
- Backend API: https://your-backend.railway.app

---

🔌 API Overview

Module| Endpoint Example
Auth| "/api/auth/login/"
Products| "/api/products/"
Orders| "/api/orders/"
Chat| "/api/chat/conversations/"

---

🔒 Security Considerations

- JWT token rotation & blacklisting
- Secure OTP-based email verification
- Role-based access control
- Input validation (CNIC, forms, uploads)
- Environment-based configuration (no secrets in repo)

---

📱 Responsive Design

- Mobile-first UI
- Bottom navigation for small devices
- Adaptive product grid
- Touch-friendly interactions

---

📈 Future Enhancements

- Payment gateway integration (JazzCash / Easypaisa)
- Notification system (real-time alerts)
- AI-based product recommendations
- Advanced analytics dashboard

---

👨‍💻 Author

Ali Hassan
GitHub: https://github.com/your-username

---

⭐ Show Your Support

If you like this project, consider giving it a ⭐ on GitHub!