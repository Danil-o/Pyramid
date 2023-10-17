const mongoose = require('mongoose');
const Product = require('./models/products');

mongoose.connect('mongodb://127.0.0.1:27017/ecomalProject')
    .then(() => {
        console.log('Mongo connection open');
    })
    .catch((e) => {
        console.log(e);
    })

const productSeeds = [
    {
        name: 'مبل هفت رنگ',
        price: 200,
        category: 'sofa',
        img: '/images/7ColorSofa.jpeg'
    },
    {
        name: 'میز هفت رنگ',
        price: 300,
        category: 'desk',
        img: '/images/7ColorDesk.jpg'
    },
    {
        name: 'چراغ',
        price: 400,
        category: 'lamp',
        img: '/images/lamp.jpg'
    },
    {
        name: 'مبل شیش رنگ',
        price: 4000,
        category: 'sofa',
        img: '/images/6ColorSofa.jpg'
    },
    {
        name: 'میز شیش رنگ',
        price: 6000,
        category: 'desk',
        img: '/images/6ColorDesk.jpg'
    },
    {
        name: 'چراغ شب خواب',
        price: 8000,
        category: 'lamp',
        img: '/images/nightLapm.jpg'
    }
];

Product.insertMany(productSeeds)
    .then(p => {
        console.log(p);
    })
    .catch(e => {
        console.log(e);
    });