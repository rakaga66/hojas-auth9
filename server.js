const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'users.json');
const MASTER_SECRET = process.env.ADMIN_SECRET || "Rr74417441@";

const readData = () => {
    if (!fs.existsSync(DATA_FILE)) return { users: [] };
    try { return JSON.parse(fs.readFileSync(DATA_FILE)); }
    catch (e) { return { users: [] }; }
};

const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4));

// الصفحة الرئيسية → صفحة اللوجين (مع تمرير الـ redirect)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// صفحة تسجيل الدخول
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// صفحة الإدارة
app.get('/admin-page', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// API الدخول للعملاء
app.post('/api/login', (req, res) => {
    const { phone } = req.body;
    const data = readData();
    const user = data.users.find(u => u.phone === phone);
    if (!user) return res.status(401).json({ success: false, error: 'الرقم غير مسجل' });

    user.isActivated = true;
    writeData(data);

    res.json({ success: true, username: user.username, token: 'hjs_' + Math.random() });
});

// API الإدارة
app.get('/api/admin/stats', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    const data = readData();
    res.json({
        total: data.users.length,
        activated: data.users.filter(u => u.isActivated).length,
        pending: data.users.filter(u => !u.isActivated).length
    });
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
    res.json({ success: true, message: 'تم التفعيل' });
});

app.delete('/api/admin/user/:username', (req, res) => {
    if (req.headers['x-admin-secret'] !== MASTER_SECRET) return res.status(403).send('Unauthorized');
    const data = readData();
    data.users = data.users.filter(u => u.username !== req.params.username);
    writeData(data);
    res.json({ success: true });
});

app.listen(PORT, () => console.log(`Hojas Auth Live on ${PORT}`));
