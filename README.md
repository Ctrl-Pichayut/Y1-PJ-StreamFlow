-----------------------------------------
1. โครงสร้างของโปรเจกต์ (Project Structure)
-----------------------------------------
โครงสร้างหลักของโปรเจกต์ถูกแบ่งออกเป็น 2 ส่วนหลักๆ ดังนี้:

```text
Project/
├── frontend/                  # ส่วนแสดงผล (Client-side)
│   ├── index.html             # หน้าแรก (เข้าสู่ระบบ/สมัครสมาชิก)
│   ├── dashboard.html         # แดชบอร์ดของสตรีมเมอร์
│   ├── donation.html          # หน้าสาธารณะสำหรับรับโดเนท
│   ├── widget.html            # วิดเจ็ตสำหรับ OBS/XSplit (แจ้งเตือนเรียลไทม์)
│   ├── css/                   # ไฟล์สไตล์ (แยกตามหน้าและส่วนประกอบ)
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── donation.css
│   │   └── widget.css
│   ├── js/                    # ไฟล์สคริปต์ทำงานฝั่ง Client
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── donation.js
│   │   └── widget.js
│   ├── img/                   # รูปภาพประกอบและไอคอน
│   │   └── pp.png
│   └── sound/                 # ไฟล์เสียงแจ้งเตือน (เช่น Alert-Sound.MP3)
│       └── Alert-Sound.MP3
│
├── backend/                   # ⚙️ ส่วนการประมวลผล (Server-side)
│   ├── config/                # การตั้งค่าฐานข้อมูล (PostgreSQL)
│   │   ├── database.js
│   │   └── init_db.sql
│   ├── controllers/           # ตรรกะการทำงานหลัก (MVC - Controller)
│   │   ├── alertController.js
│   │   ├── authController.js
│   │   ├── donationController.js
│   │   └── userController.js
│   ├── models/                # การจัดการฐานข้อมูล (MVC - Model)
│   │   ├── Donation.js
│   │   └── User.js
│   ├── routes/                # การจัดการ API Endpoints (MVC - View/Route)
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── donations.js
│   │   └── users.js
│   ├── middleware/            # ตรวจสอบสิทธิ์ (Auth) และจัดการอัปโหลดไฟล์
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── utils/                 # ฟังก์ชันช่วยเหลือ เช่น ตรวจสอบสลิป
│   │   └── slipVerifier.js
│   ├── uploads/               # ที่เก็บไฟล์รูปภาพอวตารและสลิปที่อัปโหลด
│   └── server.js              # ไฟล์หลักสำหรับรัน Backend และ Socket.io
│
├── package.json               # รายการ Dependencies รวมและสคริปต์คำสั่ง
└── vite.config.js             # การตั้งค่า Frontend Development Server
```

-----------------------------------------
2. วิธีการรันระบบ (How to Run the System)
-----------------------------------------
ก่อนจะเริ่มรันระบบ จำเป็นต้องติดตั้ง Node.js และ PostgreSQL ให้เรียบร้อยเสียก่อน

ขั้นตอนที่ 1: การเตรียมฐานข้อมูล PostgreSQL
1. สร้างฐานข้อมูลใหม่ใน PostgreSQL (เช่น ชื่อ `donation_platform`)
2. เข้าไปที่โฟลเดอร์ `backend/config/` และนำโค้ดในไฟล์ `init_db.sql` ไปรันเพื่อสร้างตารางฐานข้อมูลที่จำเป็น (`users`, `donations`)

ขั้นตอนที่ 2: ตั้งค่า Environment Variables
1. ไปที่โฟลเดอร์ `backend/`
2. ตรวจสอบและแก้ไขไฟล์ชื่อ `.env` โดยระบุค่าให้ถูกต้อง:
   PORT=3000
   DB_USER=ชื่อผู้ใช้_postgres
   DB_HOST=localhost
   DB_NAME=donation_platform
   DB_PASSWORD=รหัสผ่าน_postgres
   DB_PORT=5432
   JWT_SECRET=ใส่_รหัสลับ_อะไรก็ได้ที่คาดเดายาก
   SLIP_VERIFY_API_SECRET=คีย์สำหรับตรวจสอบสลิป_Thunder_API

ขั้นตอนที่ 3: ติดตั้ง Dependencies
เปิด Terminal หรือ Command Prompt ที่โฟลเดอร์หลักของโปรเจกต์ (ที่มีไฟล์ package.json) แล้วรันคำสั่ง:
   npm run install:all
   *(คำสั่งนี้จะช่วยติดตั้ง Node modules ให้ทั้งส่วนหลักและส่วน backend ไปพร้อมๆ กัน)*

ขั้นตอนที่ 4: การรันระบบเพื่อพัฒนา (Development Mode)
รันคำสั่งด้านล่างใน Terminal ที่โฟลเดอร์หลักของโปรเจกต์:
   npm run dev

ระบบจะทำการเปิด 2 Server ขึ้นมาพร้อมกัน:
- Frontend (Vite Development Server) จะรันที่: http://localhost:5173
- Backend (Express API Server) จะรันที่: http://localhost:3000

หมายเหตุ:
- คุณสามารถเข้าถึงหน้าเว็บไซต์และทดสอบระบบได้ผ่านลิงก์ของ Frontend (http://localhost:5173)
- สำหรับการใช้งาน Widget แจ้งเตือนในโปรแกรมไลฟ์สตรีม (เช่น OBS) ให้นำ URL "http://localhost:5173/widget.html?u=ชื่อสตรีมเมอร์" ไปเพิ่มเป็น Browser Source

-----------------------------------------
3. การปรับแต่งเพิ่มเติม (Customization)
-----------------------------------------
- การเปลี่ยนเสียงแจ้งเตือน: สามารถนำไฟล์เสียง (เช่น .mp3, .wav) ไปวางแทนที่ในโฟลเดอร์ `frontend/sound/` และแก้ไขชื่อไฟล์ใน `frontend/js/widget.js` ให้ตรงกัน
- การเปิดใช้งานระบบตรวจสลิปอัตโนมัติ: ต้องมี API Key จาก Thunder API (Thunder.in.th) นำมากรอกที่ตัวแปร `SLIP_VERIFY_API_SECRET` ในไฟล์ `.env`
=========================================
