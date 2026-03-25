// node app.js  => to run the server
// http://localhost:8000/  => to access the server


// NOTE : WHEN TIMES SESSION IS NOT NEEDED UNCOMMENT THIS, ONLY APPLICABLE FOR ONLINE FREE SERVER 
//        WITH HARDCODED PASSWORD VALIDATION WITHOUT HASHING TECHNIQUE

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
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-card {
            background: #fff;
            padding: 40px;
            width: 320px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
        }

        .login-card h2 {
            margin-bottom: 20px;
        }

        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        input {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            outline: none;
            transition: 0.3s;
        }

        input:focus {
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102,126,234,0.5);
        }

        button {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 6px;
            background: #667eea;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: 0.3s;
        }

        button:hover {
            background: #5a67d8;
        }

        .error {
            margin-top: 10px;
            color: #e53e3e;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="login-card">
    <h2>🔐 Admin Login</h2>

    <form method="post" action="/login">
        <div class="input-group">
            <input type="text" name="username" placeholder="Username" required>
        </div>

        <div class="input-group">
            <input type="password" name="password" placeholder="Password" required>
        </div>

        <button type="submit">Login</button>
    </form>

    
</div>

</body>
</html>
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

            return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #ff758c, #ff7eb3);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-card {
        background: #fff;
        padding: 40px;
        width: 360px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        text-align: center;
    }

    .icon {
        font-size: 50px;
        margin-bottom: 10px;
    }

    h2 {
        margin: 10px 0;
        color: #333;
    }

    p {
        color: #555;
        margin-bottom: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: 0.3s;
    }

    .btn:hover {
        background: #5a67d8;
    }
</style>
</head>

<body>

<div class="error-card">
    <div class="icon">🚫</div>

    <h2>Unauthorized Access</h2>


    <p>You are not allowed to view this page.</p>
    <a href="/login" class="btn">🔙 Back to Login</a>
</div>

</body>
</html>
`);
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
 */

// -------------------------------------------------------------------------------------------------------------

// NOTE : WHEN TIMES SESSION IS NOT NEEDED UNCOMMENT THIS, ONLY APPLICABLE FOR ONLINE FREE SERVER 
//        WITH DB PASSWORD VALIDATION BY HASHING TECHNIQUE  

// NOTE : THIS IS GIT LIVE RUNNING MODULE ..still we used session here i think it takes one minutes switch off other tab it close and shift admin login page 





/* const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const crypto = require('crypto');
const session = require('express-session');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt'); // ✅ ADDED
const dbo = require('./db');
const BookModel = require('./models/bookModel');
const UserModel = require('./models/userModel');

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
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-card {
            background: #fff;
            padding: 40px;
            width: 320px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
        }

        .login-card h2 {
            margin-bottom: 20px;
        }

        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        input {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            outline: none;
            transition: 0.3s;
        }

        input:focus {
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102,126,234,0.5);
        }

        button {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 6px;
            background: #667eea;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: 0.3s;
        }

        button:hover {
            background: #5a67d8;
        }

        .error {
            margin-top: 10px;
            color: #e53e3e;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="login-card">
    <h2>🔐 Admin Login</h2>

    <form method="post" action="/login">
        <div class="input-group">
            <input type="text" name="username" placeholder="Username" required>
        </div>

        <div class="input-group">
            <input type="password" name="password" placeholder="Password" required>
        </div>

        <button type="submit">Login</button>
    </form>

    
</div>

</body>
</html>
    `);
});

// 🔑 LOGIN HANDLE (✅ FIXED WITH BCRYPT)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });

    if (!user) {
                return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #ff758c, #ff7eb3);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-card {
        background: #fff;
        padding: 40px;
        width: 360px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        text-align: center;
    }

    .icon {
        font-size: 50px;
        margin-bottom: 10px;
    }

    h2 {
        margin: 10px 0;
        color: #333;
    }

    p {
        color: #555;
        margin-bottom: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: 0.3s;
    }

    .btn:hover {
        background: #5a67d8;
    }
</style>
</head>

<body>

<div class="error-card">
    <div class="icon">🚫</div>

    <h2>Unauthorized Access</h2>


    <p>You are not allowed to view this page.</p>
    <a href="/login" class="btn">🔙 Back to Login</a>
</div>

</body>
</html>
`);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
                return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #ff758c, #ff7eb3);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-card {
        background: #fff;
        padding: 40px;
        width: 360px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        text-align: center;
    }

    .icon {
        font-size: 50px;
        margin-bottom: 10px;
    }

    h2 {
        margin: 10px 0;
        color: #333;
    }

    p {
        color: #555;
        margin-bottom: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: 0.3s;
    }

    .btn:hover {
        background: #5a67d8;
    }
</style>
</head>

<body>

<div class="error-card">
    <div class="icon">🚫</div>

    <h2>Unauthorized Access</h2>


    <p>You are not allowed to view this page.</p>
    <a href="/login" class="btn">🔙 Back to Login</a>
</div>

</body>
</html>
`);
    }

    req.session.user = user.username;
    return res.redirect('/');
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
 */


const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const crypto = require('crypto');
const session = require('express-session');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt'); // ✅ ADDED
const dbo = require('./db');
const BookModel = require('./models/bookModel');
const UserModel = require('./models/userModel');

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


// 🔁 DUPLICATE CHECK (FINAL FIX)
async function isDuplicate(title, author, phone, excludeId = null) {
    const books = await BookModel.find({});

    const normTitle = title.trim().toLowerCase();
    const normAuthor = author.trim().toLowerCase();
    const normPhone = phone.replace(/\D/g, '');

    for (let b of books) {
        if (excludeId && b._id.toString() === excludeId) continue;

        const dbTitle = (b.title || '').trim().toLowerCase();
        const dbAuthor = (b.author || '').trim().toLowerCase();

        const decryptedPhone = b.phone ? decrypt(b.phone) : '';
        const dbPhone = decryptedPhone.replace(/\D/g, '');

        // ✅ NEW RULE (STRICT)
        if (
            dbPhone === normPhone ||   // same phone
            dbTitle === normTitle ||   // same name
            dbAuthor === normAuthor    // same room
        ) {
            return true;
        }
    }

    return false;
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
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-card {
            background: #fff;
            padding: 40px;
            width: 320px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
        }

        .login-card h2 {
            margin-bottom: 20px;
        }

        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        input {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            outline: none;
            transition: 0.3s;
        }

        input:focus {
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102,126,234,0.5);
        }

        button {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 6px;
            background: #667eea;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: 0.3s;
        }

        button:hover {
            background: #5a67d8;
        }

        .error {
            margin-top: 10px;
            color: #e53e3e;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="login-card">
    <h2>🔐 Admin Login</h2>

    <form method="post" action="/login">
        <div class="input-group">
            <input type="text" name="username" placeholder="Username" required>
        </div>

        <div class="input-group">
            <input type="password" name="password" placeholder="Password" required>
        </div>

        <button type="submit">Login</button>
    </form>

    
</div>

</body>
</html>
    `);
});

// 🔑 LOGIN HANDLE (✅ FIXED WITH BCRYPT)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });

    if (!user) {
        return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.redirect('/login');
    }

    req.session.user = user.username;
    return res.redirect('/');
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
        case '4':
            message = 'Duplicate Entry Not Allowed!';
            break;
    }

    res.render('main', { message, books, edit_id, edit_book });
});

// CREATE (PROTECTED)
app.post('/store_book', isAuth, async (req, res) => {
    const { title, author, phone } = req.body;

    const duplicate = await isDuplicate(title, author, phone);

    if (duplicate) {
        return res.redirect('/?status=4');
    }

    const book = new BookModel({
        title: title,
        author: author,
        phone: encrypt(phone)
    });

    await book.save();
    return res.redirect('/?status=1');
});

// UPDATE (PROTECTED)
app.post('/update_book/:edit_id', isAuth, async (req, res) => {
    let edit_id = req.params.edit_id;
    const { title, author, phone } = req.body;

    const duplicate = await isDuplicate(title, author, phone, edit_id);

    if (duplicate) {
        return res.redirect('/?status=4');
    }

    await BookModel.findOneAndUpdate(
        { _id: edit_id },
        {
            title: title,
            author: author,
            phone: encrypt(phone)
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



 

 




// -------------------------------------------------------------------------------------------------------------

// NOTE : WHEN TIMES SESSION IS NEEDED UNCOMMENT THIS, ONLY APPLICABLE FOR LOCAL DESKTOP SERVER



 /* const express = require('express');
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
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login</title>

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-card {
            background: #fff;
            padding: 40px;
            width: 320px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            text-align: center;
        }

        .login-card h2 {
            margin-bottom: 20px;
        }

        .input-group {
            margin-bottom: 15px;
            text-align: left;
        }

        input {
            width: 100%;
            padding: 10px;
            border-radius: 6px;
            border: 1px solid #ccc;
            outline: none;
            transition: 0.3s;
        }

        input:focus {
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102,126,234,0.5);
        }

        button {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: 6px;
            background: #667eea;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transition: 0.3s;
        }

        button:hover {
            background: #5a67d8;
        }

        .error {
            margin-top: 10px;
            color: #e53e3e;
            font-size: 14px;
        }
    </style>
</head>
<body>

<div class="login-card">
    <h2>🔐 Admin Login</h2>

    <form method="post" action="/login">
        <div class="input-group">
            <input type="text" name="username" placeholder="Username" required>
        </div>

        <div class="input-group">
            <input type="password" name="password" placeholder="Password" required>
        </div>

        <button type="submit">Login</button>
    </form>

    
</div>

</body>
</html>
`);
});

// 🔑 LOGIN HANDLE (✅ session regeneration added)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await UserModel.findOne({ username });

    if (!user) {
        //return res.send('❌ Invalid credentials');
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #ff758c, #ff7eb3);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-card {
        background: #fff;
        padding: 40px;
        width: 360px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        text-align: center;
    }

    .icon {
        font-size: 50px;
        margin-bottom: 10px;
    }

    h2 {
        margin: 10px 0;
        color: #333;
    }

    p {
        color: #555;
        margin-bottom: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: 0.3s;
    }

    .btn:hover {
        background: #5a67d8;
    }
</style>
</head>

<body>

<div class="error-card">
<div class="icon">🚫</div>

    <h2>Unauthorized Access</h2>


    <p>You are not allowed to view this page.</p>

    <a href="/login" class="btn">🔙 Back to Login</a>
</div>

</body>
</html>
`);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        //return res.send('❌ Invalid credentials');
        return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Error</title>

<style>
    body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        background: linear-gradient(135deg, #ff758c, #ff7eb3);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .error-card {
        background: #fff;
        padding: 40px;
        width: 360px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        text-align: center;
    }

    .icon {
        font-size: 50px;
        margin-bottom: 10px;
    }

    h2 {
        margin: 10px 0;
        color: #333;
    }

    p {
        color: #555;
        margin-bottom: 20px;
    }

    .btn {
        display: inline-block;
        padding: 10px 20px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        transition: 0.3s;
    }

    .btn:hover {
        background: #5a67d8;
    }
</style>
</head>

<body>

<div class="error-card">
    <div class="icon">🚫</div>

    <h2>Unauthorized Access</h2>


    <p>You are not allowed to view this page.</p>
    <a href="/login" class="btn">🔙 Back to Login</a>
</div>

</body>
</html>
`);
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
});   */