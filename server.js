// configure the dotenv
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
};

// importing the necessary modules for this server
const express = require('express');
// create app using express 
app = express();
// set default engine for template language. For this case I used ejs
app.set("view engine", "ejs");
const bcrypt = require('bcrypt');
const passport = require('passport');
// for logout operation
const methodOverride = require('method-override');
const flash = require('express-flash');
const session = require('express-session');
const initializePassport = require('./passport-config');
const PORT = process.env.PORT || 4000;


// initialize passport user authentication system 
/*
    if you want to used hard coded email and password and want to store on GitHub. Then you can follow this solution.
    email => process.env.ADMIN_EMAIL === email ? {id: 1, email: email, password: process.env.ADMIN_PASSWORD} : {},
    id => 1 === 1 ? id : 0
*/
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);


// normally you will use any database like mysql or mongodb
// here I am using just a simple array
const users = [];


// enable express app to read submitted urlencoded data from the post request
app.use(express.urlencoded({ extended: false }));
// enable express app to read submitted json data from the client post request
app.use(express.json());
// generate flash message 
app.use(flash());
// express session for authentication 
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, // We wont resave the session variable if nothing is changed
    saveUninitialized: false
}));
// use passport.initialize()
app.use(passport.initialize());
// use passport session 
app.use(passport.session());
// use method override to implement logout operation 
app.use(methodOverride("_method"));

// routes 
app.get("/", checkAuthenticated, (req, res) => {
    res.render('index', {
        name: req.user.name
    });
});

// login page routes 
app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login', {messages: {error: "please login!"}});
});

// register page routes 
app.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register', {messages: {}});
});

// create new user from register data submitted from /register page
app.post("/register", checkNotAuthenticated, async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        users.push({
            id: Date.now().toString(), 
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
        })
        console.log(users); // Display newly registered in the console
        res.redirect("/login")
        
    } catch (e) {
        console.log(e);
        res.redirect("/register");
    }
});

// login functionalities
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));


// logout 
app.delete("/logout", (req, res) => {
    req.logout(req.user, err => {
        if (err) return next(err);
        res.redirect("/login");
    });
});


function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect("/login")
};


function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    next()
};



app.listen(PORT, () => {
    console.log(`The server is running on http://127.0.0.1:${PORT}`);
});