// node app.js  => to run the server
// http://localhost:8000/  => to access the server

/* const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const crypto = require('crypto');
const session = require('express-session'); // 🔐 NEW
const ExcelJS = require('exceljs'); // already used
const dbo = require('./db');
const BookModel = require('./models/bookModel');

dbo.getDatabase();

// 🔐 SESSION SETUP
app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

// 🔐 Authentication middleware
function isAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/login');
}

// 🔐 Encryption setup
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update('mysecretkey123').digest();
const IV = Buffer.alloc(16, 0);

// 🔐 Encrypt
function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// 🔐 Decrypt
function decrypt(text) {
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return text;
    }
}

// 👁️ Mask phone
function maskPhone(phone) {
    if (!phone || phone.length < 10) return phone;
    return phone.substring(0, 2) + "****" + phone.substring(6);
}

app.engine('hbs', exhbs.engine({
    layoutsDir: 'views/',
    defaultLayout: "main",
    extname: "hbs",
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));

app.set('view engine', 'hbs');
app.set('views', 'views');
app.use(bodyparser.urlencoded({ extended: true }));

// 🔑 LOGIN PAGE
app.get('/login', (req, res) => {
    res.send(`
        <h2>🔐 Login</h2>
        <form method="post" action="/login">
            <input name="username" placeholder="Username" required /><br><br>
            <input name="password" type="password" placeholder="Password" required /><br><br>
            <button type="submit">Login</button>
        </form>
    `);
});

// 🔑 LOGIN HANDLE
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // ⚠️ simple demo credentials
    if (username === 'admin' && password === '1234') {
        req.session.user = username;
        return res.redirect('/');
    }

    res.send('❌ Invalid credentials');
});

// 🔑 LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// HOME (PROTECTED)
app.get('/', isAuth, async (req, res) => {
    let books = await BookModel.find({});

    books = books.map(b => {
        const decryptedPhone = b.phone ? decrypt(b.phone) : '';

        return {
            ...b._doc,
            phone: maskPhone(decryptedPhone)
        };
    });

    let message = '';
    let edit_id, edit_book;

    if (req.query.edit_id) {
        edit_id = req.query.edit_id;
        edit_book = await BookModel.findOne({ _id: edit_id });

        if (edit_book && edit_book.phone) {
            edit_book.phone = decrypt(edit_book.phone);
        }
    }

    if (req.query.delete_id) {
        await BookModel.deleteOne({ _id: req.query.delete_id });
        return res.redirect('/?status=3');
    }

    switch (req.query.status) {
        case '1':
            message = 'Inserted Successfully!';
            break;
        case '2':
            message = 'Updated Successfully!';
            break;
        case '3':
            message = 'Deleted Successfully!';
            break;
    }

    res.render('main', { message, books, edit_id, edit_book });
});

// CREATE (PROTECTED)
app.post('/store_book', isAuth, async (req, res) => {
    const book = new BookModel({
        title: req.body.title,
        author: req.body.author,
        phone: encrypt(req.body.phone)
    });

    await book.save();
    return res.redirect('/?status=1');
});

// UPDATE (PROTECTED)
app.post('/update_book/:edit_id', isAuth, async (req, res) => {
    let edit_id = req.params.edit_id;

    await BookModel.findOneAndUpdate(
        { _id: edit_id },
        {
            title: req.body.title,
            author: req.body.author,
            phone: encrypt(req.body.phone)
        }
    );

    return res.redirect('/?status=2');
});

// 📊 EXPORT (PROTECTED)
app.get('/export', isAuth, async (req, res) => {
    const books = await BookModel.find({});

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tenants');

    sheet.columns = [
        { header: 'Name', key: 'title', width: 20 },
        { header: 'Room', key: 'author', width: 15 },
        { header: 'Phone', key: 'phone', width: 20 }
    ];

    books.forEach(b => {
        const phone = b.phone ? decrypt(b.phone) : '';

        sheet.addRow({
            title: b.title,
            author: b.author,
            phone: phone
        });
    });

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        'attachment; filename=tenants.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
});

app.listen(8000, () => {
    console.log('Listening to 8000 port');
}); */


const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const crypto = require('crypto');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // ✅ ADDED
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const dbo = require('./db');
const BookModel = require('./models/bookModel');
const UserModel = require('./models/userModel');

dbo.getDatabase();

// 🔐 SESSION SETUP (✅ IMPROVED)
app.use(session({
    secret: process.env.SESSION_SECRET || 'supersecretkey', // ✅ improved
    resave: false,
    saveUninitialized: false, // ✅ fixed
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/test' // ✅ adjust if needed
    }),
    cookie: {
        httpOnly: true,
        secure: false, // set true if HTTPS
maxAge: 1000 * 60 * 3   // 3min
    }
}));

// 🔐 Authentication middleware
function isAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/login');
}

// 🔐 Encryption setup
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update('mysecretkey123').digest();
const IV = Buffer.alloc(16, 0);

// 🔐 Encrypt
function encrypt(text) {
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// 🔐 Decrypt
function decrypt(text) {
    try {
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, IV);
        let decrypted = decipher.update(text, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return text;
    }
}

// 👁️ Mask phone
function maskPhone(phone) {
    if (!phone || phone.length < 10) return phone;
    return phone.substring(0, 2) + "****" + phone.substring(6);
}

app.engine('hbs', exhbs.engine({
    layoutsDir: 'views/',
    defaultLayout: "main",
    extname: "hbs",
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));

app.set('view engine', 'hbs');
app.set('views', 'views');
app.use(bodyparser.urlencoded({ extended: true }));

// 🔑 LOGIN PAGE (✅ prevent access if already logged in)
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }

    res.send(`
        <h2>🔐 Login</h2>
        <form method="post" action="/login">
            <input name="username" placeholder="Username" required /><br><br>
            <input name="password" type="password" placeholder="Password" required /><br><br>
            <button type="submit">Login</button>
        </form>
    `);
});

// 🔑 LOGIN HANDLE (✅ session regeneration added)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });

    if (!user) {
        return res.send('❌ Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.send('❌ Invalid credentials');
    }

    // ✅ Prevent session fixation
    req.session.regenerate((err) => {
        if (err) return res.send('Session error');

        req.session.user = user._id; // ✅ better than username
        res.redirect('/');
    });
});

// 🔑 LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// HOME (PROTECTED)
app.get('/', isAuth, async (req, res) => {
    let books = await BookModel.find({});

    books = books.map(b => {
        const decryptedPhone = b.phone ? decrypt(b.phone) : '';

        return {
            ...b._doc,
            phone: maskPhone(decryptedPhone)
        };
    });

    let message = '';
    let edit_id, edit_book;

    if (req.query.edit_id) {
        edit_id = req.query.edit_id;
        edit_book = await BookModel.findOne({ _id: edit_id });

        if (edit_book && edit_book.phone) {
            edit_book.phone = decrypt(edit_book.phone);
        }
    }

    if (req.query.delete_id) {
        await BookModel.deleteOne({ _id: req.query.delete_id });
        return res.redirect('/?status=3');
    }

    switch (req.query.status) {
        case '1':
            message = 'Inserted Successfully!';
            break;
        case '2':
            message = 'Updated Successfully!';
            break;
        case '3':
            message = 'Deleted Successfully!';
            break;
    }

    res.render('main', { message, books, edit_id, edit_book });
});

// CREATE (PROTECTED)
app.post('/store_book', isAuth, async (req, res) => {
    const book = new BookModel({
        title: req.body.title,
        author: req.body.author,
        phone: encrypt(req.body.phone)
    });

    await book.save();
    return res.redirect('/?status=1');
});

// UPDATE (PROTECTED)
app.post('/update_book/:edit_id', isAuth, async (req, res) => {
    let edit_id = req.params.edit_id;

    await BookModel.findOneAndUpdate(
        { _id: edit_id },
        {
            title: req.body.title,
            author: req.body.author,
            phone: encrypt(req.body.phone)
        }
    );

    return res.redirect('/?status=2');
});

// 📊 EXPORT (PROTECTED)
app.get('/export', isAuth, async (req, res) => {
    const books = await BookModel.find({});

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tenants');

    sheet.columns = [
        { header: 'Name', key: 'title', width: 20 },
        { header: 'Room', key: 'author', width: 15 },
        { header: 'Phone', key: 'phone', width: 20 }
    ];

    books.forEach(b => {
        const phone = b.phone ? decrypt(b.phone) : '';

        sheet.addRow({
            title: b.title,
            author: b.author,
            phone: phone
        });
    });

    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
        'Content-Disposition',
        'attachment; filename=tenants.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
});

app.listen(8000, () => {
    console.log('Listening to 8000 port');
});