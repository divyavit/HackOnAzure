const mongoose    =   require('mongoose');
const userSchema  =   new mongoose.Schema({
    email:{
        type:String
    },
    password:{
        type:String
    },
    type:{
        type:String
    }
});
module.exports = mongoose.model('user',userSchema);