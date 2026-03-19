/* 
// node app.js  => to run the server
// http://localhost:8000/  => to access the server


const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const dbo = require('./db');
const BookModel = require('./models/bookModel');

dbo.getDatabase();  // only one time is intimated "database connected" for each request(CRUD) we doesnot need to intimate

app.engine('hbs',exhbs.engine({
    layoutsDir:'views/',
defaultLayout:"main",
extname:"hbs",
// ERROR :  it is not an "own property" of its parent ( if below line is not given it will not display any inputed values )
runtimeOptions : {
    allowProtoPropertiesByDefault : true,
    allowProtoMethodsByDefault : true
    
    
}

}))
app.set('view engine','hbs');
app.set('views','views');
app.use(bodyparser.urlencoded({extended:true}));

app.get('/',async (req,res)=>{
    let books = await BookModel.find({})

    let message = '';
    let edit_id, edit_book;

    if(req.query.edit_id){
        edit_id = req.query.edit_id;
        edit_book = await BookModel.findOne({_id : edit_id })
    }

    if (req.query.delete_id) {
        await BookModel.deleteOne({_id : req.query.delete_id })
        return res.redirect('/?status=3');
    }
    
    switch (req.query.status) {
        case '1':
            message = 'Inserted Succesfully!';
            break;

        case '2':
            message = 'Updated Succesfully!';
            break;

        case '3':
            message = 'Deleted Succesfully!';
            break;
    
        default:
            break;
    }


    res.render('main',{message,books,edit_id,edit_book})
})

app.post('/store_book',async (req,res)=>{
  
    const book = new BookModel({ title: req.body.title, author: req.body.author  });
    book.save();
    return res.redirect('/?status=1');
})

app.post('/update_book/:edit_id',async (req,res)=>{
    
   
    let edit_id = req.params.edit_id;

    await BookModel.findOneAndUpdate({_id : edit_id} ,{ title: req.body.title, author: req.body.author  } )    
    return res.redirect('/?status=2');
})

app.listen(8000,()=>{console.log('Listening to 8000 port');})
 */


// node app.js  => to run the server
// http://localhost:8000/  => to access the server

const express = require('express');
const app = express();
const bodyparser = require('body-parser');
const exhbs = require('express-handlebars');
const crypto = require('crypto');
const ExcelJS = require('exceljs'); // 📊 added
const dbo = require('./db');
const BookModel = require('./models/bookModel');

dbo.getDatabase();

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

// HOME
app.get('/', async (req, res) => {
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

// CREATE
app.post('/store_book', async (req, res) => {
    const book = new BookModel({
        title: req.body.title,
        author: req.body.author,
        phone: encrypt(req.body.phone)
    });

    await book.save();
    return res.redirect('/?status=1');
});

// UPDATE
app.post('/update_book/:edit_id', async (req, res) => {
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

// 📊 EXPORT TO EXCEL (NEW FEATURE ONLY)
app.get('/export', async (req, res) => {
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