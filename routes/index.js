const express = require('express');
const router = express.Router();


router.get('/',function(req,res){
   res.render('welcome', {currentuser: req.user});
});

router.get('/all' , (req,res)=>{
   const db = require('../app.js');
   db.query('select * from airline.user' , (err,result)=>{
       if(err){
           throw err;
       }
       console.log(result);
       res.send(result);
   });
});


// CODE TO FILL FORM FOR SEARCHING A FLIGHT

function findfrom(req,res,next){
   const db = require('../app.js');
   var sql = "select from_loc from airline.flight group by from_loc";
   db.query(sql,function(err,result){
       if(err){
           throw err;
       }
       req.result1 = result;
       return next();
   });
}

function findto(req,res,next){
   const db = require('../app.js');
   sql =  "select to_loc from airline.flight group by to_loc";
   db.query(sql,function(err,result){
       req.result2 = result;
       next();
   });
} 

function renderresult(req,res){
   res.render("search",{
       result1: req.result1,
       result2: req.result2
   });
}
router.get('/search',findfrom,findto,renderresult);

// ---------------------------------------------------------------------END------------------------------------------------------

//search.ejs file redirecting to /showall route
router.get('/showall',(req,res)=>{
   const db = require('../app.js');
   if(req.query.from_loc == '' || req.query.to_loc==''){
       res.redirect('/search');
   }else if(req.query.date == ''){
       db.query('select * from airline.flight where from_loc = ? and to_loc = ?',[req.query.from_loc,req.query.to_loc],function(err,result){
           console.log(result);
           res.render("showall",{result:result});
       });
   }else{
       db.query('select * from airline.flight where from_loc = ? and to_loc = ? and date = ?',[req.query.from_loc,req.query.to_loc,req.query.date],function(err,result){
           if(err){
               throw err;
           }
           console.log(result);
           res.render("showall",{result:result});
       }); 
   }
});

router.get('/flights', function(req,res){
   const db = require('../app.js');
   db.query('select * from airline.flight', function(err,result){
       if(err){
           throw err;
       }
       res.send(result);
   })
});

router.get('/registered', function(req, res){
   console.log(req.user);
   console.log(req.isAuthenticated());
   //res.render('registered');
   res.redirect('/');
});

module.exports = router;