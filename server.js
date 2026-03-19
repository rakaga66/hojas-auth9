const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// هذا السطر يخبر السيرفر أن الملفات موجودة في الواجهة الرئيسية بجانبه
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'users.json');
const MASTER_SECRET = process.env.ADMIN_SECRET || "Rr74417441@";

// دالة قراءة البيانات
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return { users: [] };
    try { return JSON.parse(fs.readFileSync(DATA_FILE)); } 
    catch (e) { return { users: [] }; }
};

const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));

// --- المسارات لعرض الصفحات المرفوعة في الواجهة ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// API التحقق والدخول
app.post('/api/login', (req, res) => {
    const { phone } = req.body;
    const data = readData();
    const user = data.users.find(u => u.phone === phone);
    if (!user) return res.status(401).json({ success: false, error: 'الرقم غير مسجل في قاف' });
    user.isActivated = true;
    writeData(data);
    res.json({ success: true, username: user.username });
});

// باقي الـ APIs للإدارة
app.get('/api/admin/stats', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    const data = readData();
    res.json({ total: data.users.length, activated: data.users.filter(u => u.isActivated).length, pending: data.users.filter(u => !u.isActivated).length });
});

app.get('/api/admin/users', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    res.json(readData().users);
});

app.post('/api/admin/add-user', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    const { username, phone } = req.body;
    const data = readData();
    if (data.users.find(u => u.phone === phone)) return res.status(400).json({ error: 'موجود مسبقاً' });
    data.users.push({ username, phone, isActivated: true, createdAt: new Date().toISOString() });
    writeData(data);
    res.json({ success: true });
});

app.delete('/api/admin/user/:username', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    const data = readData();
    data.users = data.users.filter(u => u.username !== req.params.username);
    writeData(data);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Qaf Live on ${PORT}`));
