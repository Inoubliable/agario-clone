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

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;
const COOKIE_RADIUS = 10;
const NUMBER_OF_COOKIES = 150;
var cookies = [];
var cookieX, cookieY;
var colors = ["blue", "red", "green", "yellow"];
var color;
var circles = [];

// Populate cookies array
for(i = 0; i < NUMBER_OF_COOKIES; i++) {
	createCookie();
}

function createCookie() {
	cookieX = Math.random() * WORLD_WIDTH;
	cookieY = Math.random() * WORLD_HEIGHT;
	color = colors[Math.floor(Math.random() * colors.length)];
	cookies.push([cookieX, cookieY, color]);
}

function onConnection(socket) {
	var newCircle = {
		id: socket.id,
		x: WORLD_WIDTH/2,
		y: WORLD_HEIGHT/2,
		r: parseInt(socket.request._query['r']),
		name: socket.request._query['name']
	};
	circles.push(newCircle);
	io.to(socket.id).emit('my circle', newCircle);

  	socket.on('move', function(moved){
  		checkCollisions(moved, socket);
  		circles.forEach((circle, index) => {
			if (circle.id == moved.id) {
				circles[index] = moved;
			}
		});
  	});

  	socket.on('disconnect', function(){
  		circles = circles.filter(function(circle) {
			return circle.id !== socket.id;
		});
  	});
};

setInterval(function() {
	io.emit('game update', {cookies: cookies, circles: circles});
}, 1000/60);

function checkCollisions(moved, socket) {
	cookies.forEach((cookie, index) => {
		dx = moved.x - cookie[0];
		dy = moved.y - cookie[1];
		distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < (moved.r + COOKIE_RADIUS)) {
		    cookies.splice(index, 1);
		    createCookie();
		    moved.r += 1;
		}
	});
	circles.forEach((circle, index) => {
		if (circle.id != moved.id) {
			dx = moved.x - circle.x;
			dy = moved.y - circle.y;
			distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < (moved.r + circle.r)) {
				if (moved.r > circle.r) {
					//circle dies
		    		moved.r += circle.r;
					circles = circles.filter(function(candidate) {
						return candidate.id !== circle.id;
					});
				} else if (moved.r < circle.r) {
					//moved dies
		    		circle.r += moved.r;
					circles = circles.filter(function(candidate) {
						return candidate.id !== moved.id;
					});
				}
			}
		}
	});
}

http.listen(PORT, () => {
	console.log('We are up on 3000');
});