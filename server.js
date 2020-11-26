var http = require('http');
const port = process.env.PORT||1337;
var server = http.createServer(function (req, res) {
    res.write('server active and listening on'+port);
    res.end();
});

const NodeCache = require('node-cache');
const myCache = new NodeCache();

var io = require('socket.io')(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

io.on('connection', function (user) {
user.on('EnterRoom',function(identity)
{
	console.log(identity);
	if(RoomExists(identity.roomname))
	{
		var isValidPassword = CheckPassword(identity.roomname,identity.roompassword);
		var isRoomPack = PeopleInRoom(identity.roomname)==2?true:false;
		if(isValidPassword&&!isRoomPack)
		{
			//Join Room  
			user.join(identity.roomname);
			user.emit('initiateCall','msg:start call');
		}
		else
		{
			//inform user about incorrect password or room full
		}
	}
	else
	{
		SetUpRoom(identity);
	}
});

function SetUpRoom(identity)
{
	myCache.set(identity.roomname,identity.roompassword);
	user.join(identity.roomname);
}

function RoomExists(roomname)
{
	if(myCache.has(roomname)&&io.sockets.adapter.rooms.has(roomname))
		return true;
	else
		return false;
}

function PeopleInRoom(roomname)
{
	if(io.sockets.adapter.rooms.has(roomname))
	return io.sockets.adapter.rooms.get(roomname).size;
	else 
	return 0;
}

function CheckPassword(roomname,roompassword)
{
	if(myCache.get(roomname)==roompassword)
		return true;
	else
		return false;
}

user.on('sendDescription',function(identity)
{
	//Send this to other person in room
	if(RoomExists(identity.roomname)&&CheckPassword(identity.roomname,identity.roompassword))
		user.to(identity.roomname).emit('receiveDescription',identity.description);
});

user.on('exchangeIceCandidate',function(identity)
{
	console.log('ice');
	if(RoomExists(identity.roomname)&&CheckPassword(identity.roomname,identity.roompassword))
	user.to(identity.roomname).emit('receiveIceCandidate',identity.ice)
	console.log('j');
});

user.on('exitRoom',function(identity)
{
	user.leave(identity.roomname);
	if(PeopleInRoom(identity.roomname)==0)
		myCache.del(identity.roomname)
	else
	user.to(identity.roomname).emit('exitRoom');
});

});

server.listen(port);
