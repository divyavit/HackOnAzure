const mongoose    =  require('mongoose');

const socialSchema  =  new mongoose.Schema({
    email:{
        type:String
    },
    password:{
        type:String
    },
    type:{
        type:String
    },
    name:{
        type:String,
        default: "" 
    },
    city:{
        type:String,
        default: "" 
    },
    state:{
        type:String,
        default: "" 
    },
    type:{
        type:String,
        default: "" 
    },
    availability:[{
        timing:{
            type:String //'10:00 to 11:00'
        },
        maxcount:{
            type:Number,
            default:10
        },
        type:{
            type:String //slot 1 slot 2
        },
        currentcount:{
            type:Number
        },
        customers:[{
          id: { 
            type : mongoose.Types.ObjectId, 
            ref: 'User' 
          },
          status: {
            type:Boolean,
            default:false
          }
        }]
    }]
});
module.exports = mongoose.model('social',socialSchema);