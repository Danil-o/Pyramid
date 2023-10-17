// require packages
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const appError = require('./errorHandeling/expressError');
const flash = require('connect-flash');
const jalaali = require('jalaali-js');
const methodOverride = require('method-override');
require('dotenv').config();
const emailValidator = require('email-validator');

const multer = require('multer');
const { storage, cloudinary } = require('./cloudinary');
const upload = multer({ storage });


// connect to mongo db connection
mongoose.connect(process.env.MONGO_CONNECTION)
    .then(() => {
        console.log('Mongo connection open');
    })
    .catch((e) => {
        console.log(e);
    });


// require models
const User = require('./models/user');
const Product = require('./models/products');
const Checkout = require('./models/checkout');

// set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// public folder for css js font and etc.
app.use(express.static('public'));
// for access to req.body
app.use(express.urlencoded({ extended: true }));
// set session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
// use flash alert
app.use(flash());

app.use(methodOverride('_method'));

// create local variable for alert in pages
var icon;
var title;
var text;

// create local variable to access them in all pages 
app.use(async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.carts = req.session.carts;
    res.locals.user = await User.findById(req.session.userId);
    res.locals.ICON = req.session.icon;
    res.locals.TEXT = req.session.text;
    next();
});

// for redirect user that are not logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.userId) {
        req.session.icon = 'error';
        req.session.text = 'ابتدا در سایت ما عضو شوید';
        req.flash('error', req.session.text);
        return res.redirect('/authentication');
    };
    next();
}

// home page
app.get('/', async (req, res) => {
    try {
        // to find user from req.session.userId if it exsist it means that user is logged in and it will show "myProfile" in page if not it showes logged in and register
        const user = await User.findById(req.session.userId);
        // to find 4 product for offered products in home page
        const products = await Product.find({}).limit(4);
        res.render('index', { user, products, ICON: req.session.icon, TEXT: req.session.text });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

// products page
app.get('/shop', async (req, res) => {
    try {
        // this is for get category and minPrice and maxPrice from query in URL to sort them 
        const { category, minPrice, maxPrice } = req.query;

        // it creates a object beacause mongo needs a object to find something
        let query = {};

        // if there was a category query will have category inside it
        if (category) {
            query.category = category;
        };

        // if it has minPrice and maxPrice together it will set a price inside query and do mongodb commands in it
        if (minPrice && maxPrice) {
            query.price = { $gte: minPrice, $lte: maxPrice };
            // if it is just minPrice it just write mongodb for sorting from minPrice
        } else if (minPrice) {
            query.price = { $gte: minPrice };
            // if it is just maxPrice it just write mongodb for sorting from maxPrice
        } else if (maxPrice) {
            query.price = { $lte: maxPrice };
        };

        // it will find product by that query
        const products = await Product.find(query);
        res.render('shop', { products });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.get('/productInfo/:id', async (req, res) => {
    // give product id from req.prams from url
    const { id } = req.params;
    try {
        // find product from that id
        const product = await Product.findById(id);
        res.render('productInfo', { product });
    } catch (e) {
        if (e.message.includes("Cast to ObjectId failed")) {
            req.session.icon = 'error';
            req.session.text = 'محصول یافت نشد';
            req.flash('error', req.session.text);
            res.redirect('/');
            return;
        };
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.get('/cart/add/:id', isLoggedIn, async (req, res) => {
    try {
        // give product id to add it in cart:
        const { id } = req.params;
        // find that product:
        const product = await Product.findById(id);
        // if it doesn't exsist:
        if (!product) {
            req.session.icon = 'error';
            req.session.text = 'محصول درخواستی شما یافت نشد';
            req.flash('error', req.session.text);
            res.redirect('back');
            return;
        };
        /*  for adding a product to cart we need a session because we have to use it in ejs for rendering it we need to create a variable 
            and we set the value of it req.session.carts
         */
        if (!req.session.carts) {
            // so now if it doesn't exsist we create a array of it
            req.session.carts = [];
            /*  now when we found that product that user click on add to product now we have it's id name and etc 
                we set id name and etc and set it exactly as same as the product information and we push it inside the req.session.carts array
            */
            req.session.carts.push({
                id: product._id,
                name: product.name,
                price: product.price,
                category: product.category,
                img: product.img.url,
                qty: 1,
            });

            // now if the req.session.carts exsist it means that user has a product in his cart and wants to add another product 
        } else {

            // now there is another condition that if the product that the user is adding is the same product or not

            // we save req.session.carts in a variable to we will make our code shorter
            let cart = req.session.carts;
            // and then we create a bool to see if there is a repeatedly product or not
            let newItem = true;

            // we create a loop by the cart.length
            for (let i = 0; i < cart.length; i++) {
                /* maybe it would be hard to undrestand we are checking all the products id that are added to the cart if they are 
                   the same as the earlier one insted of adding another one we add one to their qty and the qty in cart would be 2 or 
                   as many as user click on add to cart button */

                if (cart[i].id == id) {
                    cart[i].qty++;
                    // after that we will set newItem to false
                    newItem = false;
                    break;
                };
            };

            // now if it wasn't false it means that user doesn't clicks on a repeatedly product so we push another product in the cart array
            if (newItem) {
                cart.push({
                    id: product._id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    img: product.img.url,
                    qty: 1,
                });
            };
        };

        req.session.icon = 'success';
        req.session.text = 'محصول به سبد خرید اضافه شد';
        req.flash('error', req.session.text);
        res.redirect('back');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('back');
    };
});


app.get('/cart', isLoggedIn, (req, res) => {
    res.render('cart', { carts: "jdj" });
});

app.get('/cart/update/:id', isLoggedIn, async (req, res) => {
    try {
        // we get the id of that product that user wants to update it
        const { id } = req.params;
        // we get the action from query that it must be "add" , "remove" , "clear"
        const { action } = req.query;
        // and we set req.session.carts to a var to be easy to access it
        const cart = req.session.carts;

        // create a loop for cart.length that check all the products id that are in the cart
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].id == id) {
                // create a switch if for action that it must be "add" , "remove" , "clear"  
                switch (action) {
                    // if it is add we add that specific product a qty
                    case "add":
                        cart[i].qty++;
                        break;
                    // if it is remove we remove that specific product a qty
                    case "remove":
                        cart[i].qty--;
                        break;
                    // if it is clear we clear that specific product from cart
                    case "clear":
                        cart.splice(i, 1);
                        if (cart.length == 0) {
                            delete req.session.cart;
                        }
                        break;
                    default:
                        req.session.icon = 'error';
                        req.session.text = 'خطار در آپدیت سبد خرید شما';
                        req.flash('error', req.session.text);
                        break;
                };
            };
            if (cart[i].qty <= 0) {
                cart.splice(i, 1);
            }
            break;
        };
        req.session.icon = 'success';
        req.session.text = 'سبد خرید شما آپدیت شد';
        req.flash('success', req.session.text);
        res.redirect('/cart');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = e;
        req.flash('error', req.session.text);
        res.redirect('back');
    };
});

app.get('/checkout', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const products = req.session.carts;
        if (!products) {
            req.session.icon = 'error';
            req.session.text = 'ابتدا یک محصول را در سبد خرید خود قرار دهید';
            req.flash('error', req.session.text);
            res.redirect('/shop');
            return;
        };
        res.render('checkout', { user, products, ICON: req.session.icon, TEXT: req.session.text });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.post('/checkout', isLoggedIn, async (req, res) => {
    const cart = req.session.carts;
    const { username, firstname, lastname, city, postcode, phone, address } = req.body;

    if (!firstname) {
        req.session.icon = 'error';
        req.session.text = 'نام خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };
    if (!lastname) {
        req.session.icon = 'error';
        req.session.text = 'نام خانوادگی خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };
    if (!city) {
        req.session.icon = 'error';
        req.session.text = 'شهر خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };
    if (!postcode || postcode.length !== 10) {
        req.session.icon = 'error';
        req.session.text = 'کد پستی خود را وارد کنید یا کد پستی شما کمتر یا بیشتر از 10 رقم است';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };
    if (!phone || phone.length !== 11) {
        req.session.icon = 'error';
        req.session.text = 'شماره تلفن خود را وارد کنید یا شماره تلفن شما کمتر یا بیشتر از 11 رقم است';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };
    if (!address) {
        req.session.icon = 'error';
        req.session.text = 'آدرس خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/checkout');
        return;
    };

    try {
        const user = await User.findOne({ username });
        const products = cart.map(item => item.id);

        const items = cart.map(item => {
            return {
                qty: item.qty,
                price: item.price,
                total: item.qty * item.price
            };
        });
        const itemsForProduct = cart.map(item => {
            return item.name
        });

        const cartQty = cart.map(item => {
            return item.qty
        });

        const cartTotal = cart.map(item => {
            return item.total
        });

        for (let i = 0; i < itemsForProduct.length; i++) {
            const product = await Product.findOne({ name: itemsForProduct[i] });
            if (product.salesQty) {
                product.salesQty += cartQty[i];
                await product.save();
            } else {
                product.salesQty = cartQty[i];
                await product.save();
            }
        }

        const checkoutDate = new Date();
        const jalaaliDate = jalaali.toJalaali(checkoutDate.getFullYear(), checkoutDate.getMonth() + 1, checkoutDate.getDate());
        const persianDate = `${jalaaliDate.jy}/${jalaaliDate.jm}/${jalaaliDate.jd}`;
        const DATE = persianDate;

        const randNum = Math.floor(100000 + Math.random() * 900000);

        const currentMonth = new Date().getMonth();

        const checkout = new Checkout({
            OrderNum: randNum,
            username,
            firstname,
            lastname,
            city,
            postcode,
            phone,
            address,
            date: DATE,
            items,
            user: user._id,
            products
        });

        await checkout.save();

        user.checkout.push(checkout);
        await user.save();

        req.session.icon = 'success';
        req.session.text = 'سفارش شما با موفقیت ثبت شد';
        req.flash('success', req.session.text);
        req.session.carts = null;
        res.redirect('/');
    } catch (err) {
        console.error(err);
        req.session.icon = 'error';
        req.session.text = 'خطا در ارسال سفارش';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const completeUser = await User.findById(req.session.userId).populate('checkout');
        const products = [];
        for (const checkout of completeUser.checkout) {
            const checkoutProducts = [];

            for (let i = 0; i < checkout.products.length; i++) {
                const product = await Product.findById(checkout.products[i]);

                if (!product) {
                    continue;
                };

                const item = checkout.items[i];
                const productInfo = {
                    img: product.img.url,
                    name: product.name,
                    price: product.price,
                    qty: item.qty,
                    total: item.price * item.qty,
                    checkoutIndex: completeUser.checkout.indexOf(checkout)
                };
                checkoutProducts.push(productInfo);
            };

            products.push(checkoutProducts);
        };
        res.render('profile', { completeUser, products });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.get('/authentication', (req, res) => {
    res.render('authentication', { ICON: req.session.icon, TEXT: req.session.text });
});

app.get('/register', (req, res) => {
    res.redirect('/authentication');
});

app.get('/login', (req, res) => {
    res.redirect('/authentication');
});

app.get('/signin', (req, res) => {
    res.redirect('/authentication');
});

app.get('/signup', (req, res) => {
    res.redirect('/authentication');
});

app.post('/api/authentication-register', async (req, res, next) => {
    try {
        const { username, password, confirmPassword, email } = req.body;
        const exsistUser = await User.findOne({ username });
        const regex = /^[a-zA-Z0-9]+$/;
        if (!password || !username || !email) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری یا رمز عبور یا ایمیل وارد نشده است';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (username.length < 8) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری باید بیشتر از 8 کاراکتر باشد';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (!regex.test(username)) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری شما باید شامل حروف انگلیسی و اعداد باشد و نباید فاصله بین آن ها باشد';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        }
        if (password.length < 8) {
            req.session.icon = 'error';
            req.session.text = 'رمز عبور باید بیشتر از 8 کاراکتر باشد';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (!regex.test(password)) {
            req.session.icon = 'error';
            req.session.text = 'رمز عبور  شما باید شامل حروف انگلیسی و اعداد باشد و نباید فاصله بین آن ها باشد';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (password !== confirmPassword) {
            req.session.icon = 'error';
            req.session.text = 'رمز عبور شما با تکرار آن همخوانی ندارد';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (!emailValidator.validate(email)) {
            req.session.icon = 'error';
            req.session.text = 'ایمیل شما معتبر نیست';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        if (exsistUser) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری شما قبلا در سایت ثبت شده است';
            req.flash('error', req.session.text);
            res.redirect('/authentication');
            return;
        };
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        const user = new User({ username, password: hash, email });
        await user.save();
        req.session.userId = user._id;
        req.session.icon = 'success';
        req.session.text = 'حساب شما با موفقیت ساخته شد';
        req.flash('success', req.session.text);
        res.redirect('/');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = e.message;
        req.flash('error', req.session.text);
        res.redirect('/authentication');
    };
});


app.post('/api/authentication-login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری یا رمز عبور وارد نشده است';
            req.flash('error', req.session.icon);
            res.redirect('/authentication');
            return;
        };

        const user = await User.findOne({ username });
        if (!user) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری یا رمز عبور شما اشتباه است';
            req.flash('error', req.session.icon);
            res.redirect('/authentication');
            return;
        };

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            req.session.icon = 'error';
            req.session.text = 'نام کاربری یا رمز عبور شما اشتباه است';
            req.flash('error', req.session.icon);
            res.redirect('/authentication');
            return;
        };

        req.session.userId = user._id;
        req.session.icon = 'success';
        req.session.text = 'شما با موفقیت وارد حساب خود شدید';
        req.flash('success', req.session.icon);
        res.redirect('/');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/authentication');
    };
});

app.post('/logout', isLoggedIn, (req, res) => {
    req.session.userId = null;
    req.session.icon = 'success';
    req.session.text = 'شما با موفقیت از حساب خود خارج شدید';
    req.flash('success', req.session.text);
    res.redirect('/');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/adminDashboard', async (req, res) => {
    try {
        const products = await Product.find({});
        const checkouts = await Checkout.find({});
        const checkoutData = await Checkout.find().populate('user').populate('products');
        const topProducts = await Product.find({}).sort({ salesQty: -1 }).limit(5);

        const salesQtyArray = topProducts.map(product => product.salesQty);
        const salesNameArray = topProducts.map(product => product.name);

        const month1 = 1;
        const month2 = 2;
        const month3 = 3;
        const month4 = 4;
        const month5 = 5;
        const month6 = 6;
        const month7 = 7;
        const month8 = 8;
        const month9 = 9;
        const month10 = 10;
        const month11 = 11;
        const month12 = 12;

        const checkoutsForMonth1 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month1;
        });
        const checkoutsForMonth2 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month2;
        });
        const checkoutsForMonth3 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month3;
        });
        const checkoutsForMonth4 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month4;
        });

        const checkoutsForMonth5 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month5;
        });

        const checkoutsForMonth6 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month6;
        });
        const checkoutsForMonth7 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month7;
        });
        const checkoutsForMonth8 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month8;
        });
        const checkoutsForMonth9 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month9;
        });
        const checkoutsForMonth10 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month10;
        });
        const checkoutsForMonth11 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month11;
        });
        const checkoutsForMonth12 = checkouts.filter(checkout => {
            const split = checkout.date.split('/');
            const month = parseInt(split[1]);
            return month === month12;
        });

        const totals1 = checkoutsForMonth1.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal1 = totals1.reduce((acc, total) => acc + total, 0);

        const totals2 = checkoutsForMonth2.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal2 = totals2.reduce((acc, total) => acc + total, 0);

        const totals3 = checkoutsForMonth3.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal3 = totals3.reduce((acc, total) => acc + total, 0);

        const totals4 = checkoutsForMonth4.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal4 = totals4.reduce((acc, total) => acc + total, 0);

        const totals5 = checkoutsForMonth5.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal5 = totals5.reduce((acc, total) => acc + total, 0);

        const totals6 = checkoutsForMonth6.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal6 = totals6.reduce((acc, total) => acc + total, 0);

        const totals7 = checkoutsForMonth7.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal7 = totals7.reduce((acc, total) => acc + total, 0);

        const totals8 = checkoutsForMonth8.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal8 = totals8.reduce((acc, total) => acc + total, 0);

        const totals9 = checkoutsForMonth9.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal9 = totals9.reduce((acc, total) => acc + total, 0);

        const totals10 = checkoutsForMonth10.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal10 = totals10.reduce((acc, total) => acc + total, 0);

        const totals11 = checkoutsForMonth11.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal11 = totals11.reduce((acc, total) => acc + total, 0);

        const totals12 = checkoutsForMonth12.map(checkout => {
            const items = checkout.items;
            const total = items.reduce((acc, item) => acc + item.total, 0);
            return total;
        });
        const grandTotal12 = totals12.reduce((acc, total) => acc + total, 0);

        res.render('adminDashboard', { ICON: req.session.icon, TEXT: req.session.text, products, checkoutData, salesQtyArray, salesNameArray, grandTotal1, grandTotal2, grandTotal3, grandTotal4, grandTotal5, grandTotal6, grandTotal7, grandTotal8, grandTotal9, grandTotal10, grandTotal11, grandTotal12 });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطایی رخ داده است';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard');
    };
});

app.get('/adminDashboard/addProduct', async (req, res) => {
    res.render('addProduct', { ICON: req.session.icon, TEXT: req.session.text });
});

app.post('/adminDashboard/addProduct', upload.single('productImg'), async (req, res) => {
    try {
        if (!req.file) {
            req.session.icon = 'error';
            req.session.text = 'عکس خود را انتخاب کنید';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard/addProduct');
            return;
        }
        url = req.file.path;
        filename = req.file.filename;
        const { productName, productPrice, productCategory } = req.body;
        if (!productName) {
            req.session.icon = 'error';
            req.session.text = 'نام محصول خود را وارد کنید';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard/addProduct');
            return;
        };
        if (!productPrice) {
            req.session.icon = 'error';
            req.session.text = 'قیمت محصول خود را وارد کنید';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard/addProduct');
            return;
        };
        if (!productCategory) {
            req.session.icon = 'error';
            req.session.text = 'دسته بندی محصول خود را وارد کنید';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard/addProduct');
            return;
        };

        const product = new Product({ name: productName, price: productPrice, category: productCategory, img: { url, filename } });
        await product.save();
        req.session.icon = 'success';
        req.session.text = 'محصول شما با موفقیت ثبت شد';
        req.flash('success', req.session.text);
        res.redirect('/adminDashboard');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطا در ثبت محصول';
        req.flash('error', req.session.text);
        res.redirect('/');
    };
});

app.get('/adminDashboard/editProduct/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            req.session.icon = 'error';
            req.session.text = 'خطا در پیدا کردن محصول مورد نظر شما';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard');
            return;
        };
        res.render('editProduct', { ICON: req.session.icon, TEXT: req.session.text, product });
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطا در ویرایش محصول';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard');
    };
});

app.put('/adminDashboard/editProduct/:id', upload.single('productImg'), async (req, res) => {
    if (req.file) {
        url = req.file.path;
        filename = req.file.filename;
    }
    const { id } = req.params;
    const { productName, productPrice, productCategory } = req.body;
    if (!productName) {
        req.session.icon = 'error';
        req.session.text = 'نام محصول خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard/editProduct');
        return;
    };
    if (!productPrice) {
        req.session.icon = 'error';
        req.session.text = 'قیمت محصول خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard/editProduct');
        return;
    };
    if (!productCategory) {
        req.session.icon = 'error';
        req.session.text = 'دسته بندی محصول خود را وارد کنید';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard/editProduct');
        return;
    };
    const product = await Product.findByIdAndUpdate(id, { name: productName, price: productPrice, category: productCategory });
    if (req.file) {
        product.img = { url, filename };
    }
    await product.save();
    req.session.icon = 'success';
    req.session.text = 'محصول شما با موفقیت ویرایش شد';
    req.flash('success', req.session.text);
    res.redirect('/adminDashboard');
});

app.delete('/adminDashboard/deleteProduct/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const productForCloudinary = await Product.findById(id);
        if (!productForCloudinary) {
            req.session.icon = 'error';
            req.session.text = 'خطا در پیدا کردن محصول مورد نظر شما';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard');
            return;
        };
        await cloudinary.uploader.destroy(productForCloudinary.img.filename);
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            req.session.icon = 'error';
            req.session.text = 'خطا در حذف کردن محصول مورد نظر شما';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard');
            return;
        }
        req.session.icon = 'success';
        req.session.text = 'محصول شما با موفقیت حذف شد';
        req.flash('success', req.session.text);
        res.redirect('/adminDashboard');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطا در حذف محصول';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard');
    };
});

app.post('/adminDashboard/delivered/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const checkout = await Checkout.findById(id);
        if (!checkout) {
            req.session.icon = 'error';
            req.session.text = 'خطا در پیدا کردن سفارش مورد نظر شما';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard');
            return;
        }
        checkout.status = true;
        await checkout.save();
        req.session.icon = 'success';
        req.session.text = 'وضعیت سفارش مورد نظر شما تغییر کرد';
        req.flash('success', req.session.text);
        res.redirect('/adminDashboard');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطا در ثبت وضعیت سفارش';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard');
    };
});

app.delete('/adminDashboard/deleteCheckout/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const checkout = await Checkout.findByIdAndDelete(id);
        if (!checkout) {
            req.session.icon = 'error';
            req.session.text = 'خطا در پیدا کردن سفارش مورد نظر شما';
            req.flash('error', req.session.text);
            res.redirect('/adminDashboard');
            return;
        }
        req.session.icon = 'success';
        req.session.text = 'سفارش شما با موفقیت حذف شد';
        req.flash('success', req.session.text);
        res.redirect('/adminDashboard');
    } catch (e) {
        req.session.icon = 'error';
        req.session.text = 'خطا در حذف سفارش';
        req.flash('error', req.session.text);
        res.redirect('/adminDashboard');
    };
});

app.all('*', (req, res, next) => {
    next(new appError('Page not found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).send(message);
});

app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});