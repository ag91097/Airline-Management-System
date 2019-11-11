const express = require('express');
const router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;
var passport = require('passport');

//BASIC BOOKING FORM RENDERING
router.get('/book/:id', authenticateMiddleware(), function(req,res){
    res.render('booking',{flight_id: req.params.id});
});

//ADD BASIC BOOKING DETAILS TO booking table in database
router.post('/book/:id', function(req,res){
    const db = require('../app.js');
    db.query('select price_b, price_e from airline.flight where fcode = ?',[req.params.id], function(err, result){
        if(err){
            throw err;
        }
        if(req.body.class === "economy"){
            console.log("yes economy");
            req.price = result[0].price_e;
        }else{
            req.price = result[0].price_b;
        }
        console.log(req.price);
        req.price = req.price * req.body.seats;
        db.query('insert into airline.booking (user, seats, price, class) values (?, ?, ?, ?)', [req.user.email, req.body.seats, req.price, req.body.class], function(err, result){
            if (err){
                throw err;
            }
            console.log(req.body.class);
            res.render('details', {seat: req.body.seats, price: req.price, flight_id: req.params.id, classes: req.body.class});
        });
    });
});

//ROUTE THAT ADD PASSENGER DEATILS TO passenger table
router.post('/add/:id', function(req, res){
    console.log(req.body);
    console.log('working');
    let value = [];
    console.log(req.body.num_seats);
    if(req.body.num_seats == 1){
        console.log('entered 1st');
        value.push(req.params.id);
        value.push(req.user.email);
        value.push(req.body.name);
        value.push(req.body.gender);
        value.push(req.body.class);
        const db = require('../app.js');
        db.query('insert into airline.passenger (fcode, user, name, gender, ttype) values (?, ?, ?, ?, ?)', [req.params.id, req.user.email, req.body.name, req.body.gender, req.body.class], function(err, result){
            if(err){
                throw err;
            }
            console.log('tickets confirmed');
            res.redirect('/users/tickets'); 
        });
    } else {
        console.log('entered 2nd');
        for(let i=0; i<req.body.num_seats; i++){
            value.push([]);
            value[i].push(req.params.id);
            value[i].push(req.user.email);
            value[i].push(req.body.name[i]);
            value[i].push(req.body.gender[i]);
            value[i].push(req.body.class[i]);
        }
        const db = require('../app.js');
        db.query('insert into airline.passenger (fcode, user, name, gender, ttype) values ?', [value], function(err, result){
        if(err){
            throw err;
        }
        console.log('tickets confirmed');
        res.redirect('/users/tickets');
        });
    }
});

//route that shows all TICKETS booked by the current user and render showtickets ejs file
router.get('/tickets', authenticateMiddleware(), function(req, res){
    const db = require('../app.js');
    db.query('select * from airline.passenger where user = ?', [req.user.email], function(err, result){
        if(err){
            throw err;
        }
        res.render('showtickets', {currentuser: req.user, num: result.length, result: result});
    });
});

//cancellling ticket
router.post('/cancel/:id', function(req,res){
    const db = require('../app.js');
    db.query('delete from airline.passenger where tid = ?', [req.params.id], function(err, result){
        if(err){
            throw err;
        }
        res.redirect('/users/tickets');
    });
});

router.get('/more/:id', function(req, res){
    const db = require('../app.js');
    
    res.render('more');
});

//LOGIN PAGE
router.get('/login',function(req,res){
    res.render("login");
});

//LOGIN POST REQUEST
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
    }), function(req,res){
        console.log('working');
});

//LOGOUT ROUTE
router.get('/logout', function(req, res){
    req.logout();
    req.flash('success_msg', 'You are logged out');
    req.session.destroy();
    res.redirect('/');
});

//REGISTER PAGE
router.get('/register',function(req,res){
    res.render("register");
});

//REGISTER POST REQUEST
router.post('/register',(req,res)=>{
    const{name, email, password, password2} = req.body;
    let errors = [];

    //check required fields
    if(!name || !email || !password ||!password2){
        errors.push({ msg : 'Please fill in all the details'});
    }

    //password match
    if(password !== password2){
        errors.push({msg:'Passwords do not match'});
    }

    //check pass length
    if(password.length<6){
        errors.push({msg:'password shoud be atleast 6 characters'});
    }

    if(errors.length > 0){
        res.render('register',{
            errors,
            name,
            email,
            password,
            password2
        });
    }else{
        //USER VALIDATION SUCCESSFULL   
        const db = require('../app.js');
        db.query('select email from airline.user where email = ?', [email], function(err, result){
            if(err){
                throw err;
            }
            // EMAIL ALREADY REGISTERED IN DATABASE
            if(result.length !== 0){                                    
                errors.push({msg: 'Email is already registered'});
                res.render('register',{
                    errors,
                    name,
                    email,
                    password,
                    password2
                });
            }else{
                bcrypt.hash(password, saltRounds, function(err,hash){
                    db.query('INSERT INTO airline.user (name, email, password) VALUES (?, ?, ?)', [name, email, hash], (err,result)=>{
                        if(err){
                            throw err;
                        }
                            // 'SELECT LAST_INSERT_ID() as user_id
                        db.query('SELECT email from airline.user where email = ?', [email], function(err,result){
                            if(err){
                                throw err;
                            }
        
                            const user_id = result[0];
                            console.log(result);
                            req.login(user_id, function(err){
                            req.flash('success_msg', 'You are registered');
                            //res.redirect('/registered');
                            res.redirect('/');
                            });
                        });
                    });
                });
            }
        });     
    }
});

passport.serializeUser(function(user_id, done){
    done(null, user_id);
});

passport.deserializeUser(function(user_id, done){
    done(null, user_id);
});

function authenticateMiddleware(){
    return(req, res, next)=>{
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if(req.isAuthenticated()){
            return next();
        } else {
            req.flash('err_msg', 'Please log in to access');
            res.redirect('/users/login');
        }        
    }
}

module.exports = router;