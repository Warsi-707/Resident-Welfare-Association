# 📖 RWA پروجیکٹ سیٹ اپ گائیڈ (PostgreSQL, Node.js, React.js)

یہ گائیڈ آپ کے **Resident Welfare Association (RWA)** سسٹم کو **React.js (Frontend)**، **Node.js Express (Backend)** اور **PostgreSQL (Database)** کے ساتھ چلانے کے لیے مکمل رہنمائی فراہم کرتی ہے۔

---

## 📌 1. سسٹم کے اجزاء (Tech Stack)

| حصہ | ٹیکنالوجی | تفصیل |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | تیز رفتار اور جدید یوزر انٹرفیس |
| **Backend** | Node.js + Express.js | محفوظ اور تیز رفتار REST API |
| **Database** | PostgreSQL (psql) | طاقتور اور قابل اعتماد ریلیشنل ڈیٹا بیس |
| **ORM** | Prisma ORM | ماڈلز، مائیگریشنز اور کوئریز کے لیے |

---

## 🛠️ 2. PostgreSQL سیٹ اپ کرنے کا طریقہ

### طریقہ 1: `psql` کمانڈ لائن کے ذریعے
1. اپنے کمپیوٹر پر **SQL Shell (`psql`)** کھولیں:
   ```bash
   psql -U postgres
   ```
2. اپنا PostgreSQL پاس ورڈ درج کریں۔
3. نیا ڈیٹا بیس بنانے کے لیے یہ کمانڈ چلائیں:
   ```sql
   CREATE DATABASE rwa_db;
   ```
4. چیک کرنے کے لیے:
   ```sql
   \l
   ```
5. باہر نکلنے کے لیے:
   ```sql
   \q
   ```

### طریقہ 2: **pgAdmin** GUI کے ذریعے
1. **pgAdmin 4** کھولیں۔
2. بائیں جانب **Servers** > **PostgreSQL** پر رائٹ کلک کریں۔
3. **Create** > **Database...** منتخب کریں۔
4. Database Name میں `rwa_db` لکھیں اور **Save** پر کلک کریں۔

---

## ⚙️ 3. `.env` فائل کنفیگریشن

پروجیکٹ کے روٹ فولڈر میں موجود `.env` فائل میں اپنے PostgreSQL کا یوزرنیم اور پاس ورڈ سیٹ کریں:

```env
# Format: postgresql://<USER>:<PASSWORD>@localhost:5432/<DB_NAME>?schema=public
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rwa_db?schema=public"

# JWT Secret Key
JWT_SECRET="rwa-super-secret-jwt-key-2026-change-in-production"

# Port (ڈیفالٹ: 3000)
PORT=3000
```

> ⚠️ **نوٹ:** اگر آپ کا PostgreSQL پاس ورڈ مختلف ہے، تو `postgres:postgres` کی جگہ اپنا پاس ورڈ لکھیں (مثال کے طور پر `postgresql://postgres:mypassword123@localhost:5432/rwa_db?schema=public`)۔

---

## 🚀 4. پراجیکٹ چلانے کے اقدامات (Commands)

### مرحلہ 1: پیکیجز انسٹال کریں
```bash
npm install
```

### مرحلہ 2: ڈیٹا بیس اسکیما PostgreSQL پر اپلائی کریں
```bash
npm run db:push
```

### مرحلہ 3: ڈیفالٹ ڈیٹا (Admin اور Staff) سیڈ کریں
```bash
npm run db:seed
```

### مرحلہ 4: پراجیکٹ اسٹارٹ کریں
```bash
npm run dev
```

اب براؤزر میں یہ لنک کھولیں:
👉 **`http://localhost:3000`**

---

## 🔑 5. لاگ ان کریڈینشلز (Login Details)

ڈیٹا بیس سیڈ ہونے کے بعد یہ اکاؤنٹس فوری استعمال کے لیے تیار ہیں:

| رول | یوزرنیم | پاس ورڈ | رسائی |
|---|---|---|---|
| **ایڈمنسٹریٹر (Admin)** | `admin` | `admin123` | تمام ماڈیولز، ممبران، رپورٹس، ریورسل، سیٹنگز |
| **کلیکشن اسٹاف (Staff)** | `staff` | `staff123` | فیس کلیکشن، چالان چیکنگ، رسید پرنٹنگ |

---

## 📊 6. ڈیٹا بیس دیکھنے کا طریقہ (Prisma Studio)

اگر آپ ڈیٹا بیس کے تمام ریکارڈز (Users, Members, Challans, Payments) کو ایک گرافیکل ویب انٹرفیس میں دیکھنا یا ایڈٹ کرنا چاہتے ہیں:

```bash
npm run db:studio
```
یہ آپ کے براؤزر میں **`http://localhost:5555`** پر کھل جائے گا۔

---

## 📁 7. فولڈر اسٹرکچر

```text
├── prisma/
│   ├── schema.prisma         # PostgreSQL اسکیما اور ماڈلز
│   └── seed.ts               # ڈیٹا بیس سیڈ اسکرپٹ
├── server/                   # Node.js + Express Backend
│   ├── db.ts                 # Prisma Client
│   ├── middleware/auth.ts    # JWT Authentication
│   └── routes/               # تمام API روٹس (Auth, Members, Challans, Payments وغیرہ)
├── src/                      # React.js Frontend
│   ├── components/           # تمام UI کمپوننٹس (Admin, Members, Challans, Reports)
│   ├── context/AppContext.tsx# گلوبل اسٹیٹ مینجمنٹ
│   ├── services/api.ts       # Backend API سے کنکشن
│   ├── types.ts              # ڈیٹا ٹائپس
│   └── App.tsx               # مین ایپ روٹنگ
├── .env                      # ڈیٹا بیس اور سرور سیٹنگز
└── server.ts                 # ایکسپریس سرور انٹری پوائنٹ
```
