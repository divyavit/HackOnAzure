var express = require('express');
var router = express.Router();
const qrcode = require('qrcode');
let mongoose = require('mongoose');
let User = require('../models/user');
let Social = require('../models/social');
let VerifyToken = require('../Controller/verifyToken.js');
let Helper = require('../Controller/Helper.js');
var NodeWebcam = require( "node-webcam" );
var jwt = require('jsonwebtoken'); 
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
let fs = require('fs');
router.get('/', (req, res) => {
    res.render('qrcode');
})


router.get('/showcaptureImage', function(req, res, next) {
    var Webcam = NodeWebcam.create(  );
    Webcam.capture( "../uploads/test_picture", function( err, data ) {} );
 
});



router.get('/:owner_id/scan', (req, res) => {
    res.render('scancode');

})
router.get('/me', VerifyToken, function(req, res, next) {

    User.findById(req.userId, { password: 0 }, function (err, user) {
      if (err) return res.status(500).send("There was a problem finding the user.");
      if (!user) return res.status(404).send("No user found.");
      res.status(200).send(user);
});
});

router.post('/booking/:owner_id/:customer_id', (req, res) =>{
    console.log("here");
    console.log(req.body);
    Social.findOne(mongoose.Types.ObjectId(req.params.owner_id), function(err,place) {
        console.log(place)
        let available = place.availability;
        let updated  = [];
        let new_slot = {};
        console.log(available);
        for(let i = 0;i<available.length;i++) {
            let slot = available[i];
            if(slot.timing == req.body.search_categories) {
                slot.currentcount++;
                let customers = slot.customers;
                let new_ones = {};
                new_ones["id"] = mongoose.Types.ObjectId(req.params.customer_id);
                new_ones["status"] = false;
                customers.push(new_ones);
                slot.customers = customers;
                new_slot = slot;
            }
            else {
                updated.push(slot);
            }
        }
        updated.push(new_slot);
        Social.findOneAndUpdate({_id:mongoose.Types.ObjectId(req.params.owner_id)}, {$set:{availability:updated}}, function(err,updated) {
            console.log("new updated",updated)
            let temp = []
            temp.push(req.params.customer_id);
            temp.push(req.body.search_categories);
            qrcode.toDataURL(temp, {errorCorrectionLevel: 'H'}, (err, url)=>{
                //console.log(url);
                res.render('generatedcode', {data:url});
                
            })
        })
    })
})

router.get('/list/:id/:customer_id', (req, res) => {
    //console.log(req.params.id,req.params.customer_id)
    Social.findById(mongoose.Types.ObjectId(req.params.id), function(err,place) {
        let available = place.availability;
        let options  = []
        for(let i = 0;i<available.length;i++) {
            let slot = available[i];
            //console.log("place",slot);
            if(slot.currentcount < slot.maxcount) {
                options.push(slot.timing);
                //console.log(options);
            }
        }
        res.render('time_slot',{list:options,owner_id:req.params.id,customer_id:req.params.customer_id});
    })
    
})

router.post('/owner/:id', (req,res) => {
    console.log(req.params.id);
    let booked =[];
    Social.findOne(mongoose.Types.ObjectId(req.params.id), function(err,place) {
        let available = place.availability;
        for(let i = 0;i<available.length;i++) {
            let slot = available[i];
            if(slot.timing == req.body.search_categories) {
                booked = slot.customers;
                break;
            }
        }
        res.render('customers',{list:booked, id:req.params.id})
    })
    
})

router.post('/location', (req, res) => {
    //console.log("its here")
    //console.log(req.body)
    let userId;
    let token = req.body.token;
    jwt.verify(token, process.env.secret||'divya', function(err, decoded) {      
        if (err) 
            return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });    
        userId = decoded.userId;
    });
    if(req.body.user_type == "user") {
        User.findById(userId, function (err, user) {
            if (err) {
                console.log("error");
                return err;
            }
            else{
                let type = req.body.type;
                let state = req.body.state;
                let city = req.body.city
                Social.find({type:type,state:state,city:city},function (err, owner) {
                    if (err) {
                        console.log("error");
                        return err;
                    } 
                    else {
                        let list = [];
                        for(let x = 0; x<owner.length;x++) {
                            let info = {};
                            info["name"] = owner[x].name;
                            info["id"] = owner[x]._id;
                            list.push(info);
                        }
                        res.render('list',{token:token,user:user,customer_id:user._id,list:list,type:type});
                    }
                });
                
            }
        });
    }
    else {
        let type = req.body.type;
        let state = req.body.state;
        let city = req.body.city;
        let name = req.body.name;
        let slots =[
            {
                timing:'10:00 to 12:00',
                maxcount:10,
                type:'Slot 1',
                currentcount:0,
                customers:[]
            },
            {
                timing:'12:00 to 14:00',
                maxcount:10,
                type:'Slot 2',
                currentcount:0,
                customers:[]
            },
            {
                timing:'14:00 to 16:00',
                maxcount:10,
                type:'Slot 3',
                currentcount:0,
                customers:[]
            },
            {
                timing:'16:00 to 18:00',
                maxcount:10,
                type:'Slot 4',
                currentcount:0,
                customers:[]
            },
            {
                timing:'18:00 to 20:00',
                maxcount:10,
                type:'Slot 5',
                currentcount:0,
                customers:[]
            },
            {
                timing:'20:00 to 22:00',
                maxcount:10,
                type:'Slot 6',
                currentcount:0,
                customers:[]
            }
        ]
        Social.findOneAndUpdate({_id:userId},{$set:{type:type,name:name,state:state,city:city,availability:slots}},function (err, owner) {
            if (err) {
                console.log("error");
                return err;
            } 
            else {
                console.log(owner);
                res.render('customer_at_places',{token:token,id:owner._id, owner:owner})
            }
        });  
    }

})

router.post('/login', (req, res) =>{
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({'message': 'Some values are missing'});
    }
    if (!Helper.isValidEmail(req.body.email)) {
        return res.status(400).send({ 'message': 'Please enter a valid email address' });
    }
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) {
            return res.status(500).send('Error on the server.');
        }
        if (!user) {
            Social.findOne({ email: req.body.email }, function (err, owner) {
                //console.log(owner);
                if(!owner) {
                    return res.status(404).send('No user found.');
                }
                var passwordIsValid = Helper.comparePassword(owner.password, req.body.password);
                if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
                const token = Helper.generateToken(owner._id);
                //console.log("here");
                res.render('customer_at_places',{token:token,owner:owner,id:owner._id,type:"owner"});
            });
        }
        else {
            var passwordIsValid = Helper.comparePassword(user.password, req.body.password);
            if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
            const token = Helper.generateToken(user._id);
            //console.log(token)
            res.render('main_page_user',{token:token,user:user,customer_id:user._id,type:"user"});
            
        }
      });
})

router.post('/register',(req, res)=>{
    if (!req.body.email || !req.body.password) {
        return res.status(400).send({'message': 'Some values are missing'});
      }
    if (!Helper.isValidEmail(req.body.email)) {
        return res.status(400).send({ 'message': 'Please enter a valid email address' });
      }
    const hashPassword = Helper.hashPassword(req.body.password);
    if(req.body.type == "Customer") {
        let user = new User({
            email:req.body.email,
            password:hashPassword,
            type:req.body.type
        });
        user.save((err, data)=>{
            if(err) {
                console.log(err);
            }
            else{
                const token = Helper.generateToken(user._id);
                res.render('main_page_user',{token:token,user:user,type:"user"});
            }
        });
    }
    else {
        console.log(req.body);
        let social = new Social({
            email:req.body.email,
            password:hashPassword,
            type:req.body.type
        });
        social.save((err, data)=>{
            if(err) {
                console.log(err);
            }
            else{
                const token = Helper.generateToken(social._id);
                res.render('main_page_owner',{token:token,social:social,type:"owner"});
            }
        });
    }
});

module.exports = router;