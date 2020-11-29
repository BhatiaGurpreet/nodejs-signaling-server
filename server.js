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
		if(isValidPassword)
		{
			//Join Room  
			user.join(identity.roomname);
			console.log('sending initiation to oher members'+user.id);
			user.to(identity.roomname).emit('initiateCall',user.id);
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
		user.to(identity.peerid).emit('receiveDescription',identity);
});

user.on('exchangeIceCandidate',function(identity)
{
	console.log('ice');
	if(RoomExists(identity.roomname)&&CheckPassword(identity.roomname,identity.roompassword))
	user.to(identity.peerid).emit('receiveIceCandidate',identity)
});

user.on('peerLeft',function(identity)
{
	console.log(identity);
	user.leave(identity.roomname);
	if(PeopleInRoom(identity.roomname)==0)
		myCache.del(identity.roomname);
	user.to(identity.roomname).emit('peerLeft',identity);
});

});

server.listen(port);
