const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// تشغيل الملفات من المجلد الرئيسي مباشرة
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'users.json');

// تأكد من وجود ملف users.json عشان ما ينهار السيرفر
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }));
}

// --- المسارات الرئيسية ---

// الصفحة الرئيسية (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// صفحة تسجيل الدخول (login.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// API الدخول
app.post('/api/login', (req, res) => {
    const { phone } = req.body;
    try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE));
        const user = data.users.find(u => u.phone === phone);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'الرقم غير مسجل' });
        }

        res.json({ 
            success: true, 
            username: user.username, 
            token: 'hjs_' + Math.random().toString(36).substr(2, 9) 
        });
    } catch (e) {
        res.status(500).json({ success: false, error: 'خطأ في الخادم' });
    }
});

app.listen(PORT, () => console.log(`Running on ${PORT}`));
