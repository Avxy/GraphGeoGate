const express = require('express');
const app = express();
const path = require('path')
const jsdom = require("jsdom");
const { JSDOM } = jsdom
const { window } = new JSDOM(`...`);
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { v4: uuidV4 } = require('uuid')
const {ExpressPeerServer} = require('peer')
const peer = ExpressPeerServer(http , {
	debug:true
  });



// const truffleCfg = require('./seed/truffle-config')
// const Drizzle = require('@drizzle/store')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'public_html/src'))

app.use(express.static('public_html/src'));
app.use(express.static('public_html/libs'));
app.use('/peerjs', peer);
// app.use(express.static('public_html/src/v3'));
// app.get('/',function(req, res, next) {
// 	next()
//     res.render('index');
	
// });
// app.get('/drizzle', (req, res)=>{
// 	res.render('drizzle')
// })

app.get('/', (req, res) => {
	res.render('room', {uuidV4, RoomId: req.params.room })
  })

// app.get('/', (req, res) => {
// 	res.redirect(`/${uuidV4()}`)
//   })
  
 

///////////// Nik Code //////////////////////
io.sockets.on('connection', function(socket){
	socket.userData = { x:0, y:0, z:0, heading:0 };//Default values;
 
	console.log(`${socket.id} connected`);
	socket.emit('setId', { id:socket.id });
	
    socket.on('disconnect', function(){
		socket.broadcast.emit('deletePlayer', { id: socket.id });
    });	
	
	socket.on('init', function(data){
		console.log(`socket.init ${data.model}`);
		socket.userData.model = data.model;
		socket.userData.colour = data.colour;
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb,
		socket.userData.action = "Idle";
	});
	
	socket.on('update', function(data){
		socket.userData.x = data.x;
		socket.userData.y = data.y;
		socket.userData.z = data.z;
		socket.userData.heading = data.h;
		socket.userData.pb = data.pb,
		socket.userData.action = data.action;
	});
	
	socket.on('chat message', function(data){
		console.log(`chat message:${data.id} ${data.message}`);
		io.to(data.id).emit('chat message', { id: socket.id, message: data.message });
	})
///////////////////////////////////////////////

socket.on('newUser' , (id , room)=>{
	socket.join(room);
	socket.to(room).broadcast.emit('userJoined' , id);
	socket.on('disconnect' , ()=>{
		socket.to(room).broadcast.emit('userDisconnect' , id);
	})
  })
  })

http.listen(process.env.PORT||8080, function(){
  console.log('listening on *:8080');
});
////////////////////////// Nik Code ///////////////////////
setInterval(function(){
	const nsp = io.of('/');
    let pack = [];
	
    for(let id in io.sockets.sockets){
        const socket = nsp.connected[id];
		//Only push sockets that have been initialised
		if (socket.userData.model!==undefined){
			pack.push({
				id: socket.id,
				model: socket.userData.model,
				colour: socket.userData.colour,
				x: socket.userData.x,
				y: socket.userData.y,
				z: socket.userData.z,
				heading: socket.userData.heading,
				pb: socket.userData.pb,
				action: socket.userData.action
			});    
		}
    }
	if (pack.length>0) io.emit('remoteData', pack);
}, 40);
 
////////////////////////////////////////////////////////////////