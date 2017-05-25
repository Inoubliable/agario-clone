var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
	res.redirect('game.html');
});
app.get('/dead', (req, res) => {
	res.redirect('index.html');
});

io.on('connection', onConnection);

var users = [];
var circles = [];
function onConnection(socket) {
	io.to(socket.id).emit('existing circles', circles);
	var newCircle = {
		id: socket.id,
		x: parseInt(socket.request._query['x']),
		y: parseInt(socket.request._query['y']),
		r: parseInt(socket.request._query['r']),
		name: socket.request._query['name']
	};
	circles.push(newCircle);
	socket.broadcast.emit('new circle', newCircle);

	users[socket.id] = socket.request._query['name'];

  	socket.on('move', function(moved){
  		checkCollisions(moved, socket);
  		circles.forEach((circle, index) => {
			if (circle.id == moved.id) {
				circles[index] = moved;
			}
		});
  		socket.broadcast.emit('move', moved);
  	});

  	socket.on('disconnect', function(){
  		circles = circles.filter(function(circle) {
			return circle.id !== socket.id;
		});
    	io.emit('user disconnected', socket.id);
  	});
};

function checkCollisions(moved, socket) {
	circles.forEach((circle, index) => {
		if (circle.id != moved.id) {
			dx = moved.x - circle.x;
			dy = moved.y - circle.y;
			distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < (moved.r + circle.r)) {
				if (moved.r > circle.r) {
					//circle dies
					circles = circles.filter(function(candidate) {
						return candidate.id !== circle.id;
					});
					socket.emit('dead', circle.id);
				} else if (moved.r < circle.r) {
					//moved dies
					circles = circles.filter(function(candidate) {
						return candidate.id !== moved.id;
					});
					socket.emit('dead', moved.id);
				}
			}
		}
	});
}

http.listen(PORT, () => {
	console.log('We are up on 3000');
});