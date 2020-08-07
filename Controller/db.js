const mongoose = require('mongoose');
mongoose.connect(process.env.URL || 'mongodb://localhost:27017/qrdemo', {
	useNewUrlParser: true, 
	useUnifiedTopology: true 
});
let db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open",(callback)=>{
	console.log("connection succeeded");
});
module.exports = db;