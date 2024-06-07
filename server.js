const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

app.set("view engine", "ejs");

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).send("Email and password are required");
        return;
    }
    try {
        await db.collection('users').doc(email).set({
            email: email,
            password: password
        });
        res.redirect('/login');
    } catch (error) {
        res.status(500).send("Error saving user: " + error.message);
    }
});

app.get('/login', (req, res) => {
    res.render('login', { message: '' });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.render('login', { message: 'Invalid email or password' });
        return;
    }
    try {
        const userDoc = await db.collection('users').doc(email).get();
        if (!userDoc.exists || userDoc.data().password !== password) {
            res.render('login', { message: 'Invalid email or password' });
        } else {
            res.redirect('/dashboard');
        }
    } catch (error) {
        res.status(500).send("Error logging in: " + error.message);
    }
});

app.listen(port, () => { console.log(`Started the server at ${port}`); });
