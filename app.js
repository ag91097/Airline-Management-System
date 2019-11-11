const express = require('express');
//const expressLayouts = require('express-ejs-layouts');
const mysql = require('mysql');
const app = express();
const path = require('path');
const flash= require('connect-flash'); //for some flash messaging
const PORT = process.env.PORT || 3000;

//AUTHENTICATION PACKAGES
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//for session store
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');

//EJS template engine
//app.use(expressLayouts);
app.set('view engine' , 'ejs');

//body-parser
app.use(express.urlencoded({extended : false}));

//to server static files
app.use(express.static(path.join(__dirname, 'public')));

//for session store 
var options = {
    host     : 'localhost',
    user     : 'root',
    password : 'qwerty',
    database : 'airline',
    insecureAuth: true
};

var sessionStore = new MySQLStore(options);

//express-session middleware
app.use(session({
    secret: 'qwertyu',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    // cookie: {secure: true}
}));


//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//middleware for using flash
app.use(flash());

//some custom middleware with Global variables
app.use((req, res, next)=>{
    res.locals.currentuser = req.user;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//create connection with database
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'qwerty',
    database : 'airline',
    insecureAuth: true
});

//CONNECT database
db.connect((err)=>{
    if(err){
        throw err;
    }
    console.log('connection with database successful');
});

//ROUTES
app.use('/',require('./routes/index.js'));

app.use('/users' , require('./routes/users.js'));

passport.use(new LocalStrategy(
    function(username, password, done) {                            //username <== email
        console.log(username);                                      // username <== email
        console.log(password);

        db.query('select * from airline.user where email = ?', [username], function(err, result){

            if(err){
                done(err);              
            }
            if(result.length === 0 ){
                return done(null, false, { message: 'Email is not registered'});             // unsuccesfull login
            }

            const hash = result[0].password.toString();

            bcrypt.compare(password, hash, function(err, response){
                if(response === true){
                    return done(null, {email: result[0].email});
                }else{
                    return done(null, false, { message: 'Password incorrect'});
                }
            });
        });
    }
));


app.listen(PORT,()=>{
    console.log(`server started on port ${PORT}`);
});

//exported to use it in users.js file
module.exports = db;