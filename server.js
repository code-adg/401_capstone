const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

var serviceAccount = require("./key.json");
initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();
const auth = getAuth();

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
        const userRecord = await auth.createUser({
            email: email,
            password: password
        });
        await db.collection('users').doc(userRecord.uid).set({
            email: email
        });
        res.redirect('/login');
    } catch (error) {
        res.status(500).send("Error signing up user: " + error.message);
    }
});

app.get('/login', (req, res) => {
    res.render('login', { message: '' });
});

app.post('/login', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) {
        res.status(400).json({ success: false, message: 'Invalid ID token' });
        return;
    }
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        const userRecord = await auth.getUser(uid);
        res.cookie('session', idToken, { httpOnly: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error logging in: " + error.message });
    }
});

app.listen(port, () => { console.log(`Started the server at ${port}`); });
