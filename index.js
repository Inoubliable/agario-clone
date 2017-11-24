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
const INITIAL_RADIUS = 30;
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
		r: INITIAL_RADIUS,
		name: socket.request._query['name']
	};
	circles.push(newCircle);
	io.to(socket.id).emit('my circle', newCircle);

  	socket.on('move', function(moved){
  		//checkCollisions(moved, socket);
  		circles.forEach((circle, index) => {
			if (circle.id == moved.id) {
				circles[index].x = moved.x;
				circles[index].y = moved.y;
			}
		});
  	});

  	socket.on('ping', function(){
  		io.emit('pong', 'Pong');
  	});

  	socket.on('disconnect', function(){
  		circles = circles.filter(function(circle) {
			return circle.id !== socket.id;
		});
  	});
};

// game physics loop
setInterval(function() {
	checkCollisions();
}, 1000/66);

// send game state loop
setInterval(function() {
	io.emit('game update', {cookies: cookies, circles: circles});
}, 1000/60);

function checkCollisions() {
	circles.forEach((circle1, index) => {
		circles.forEach((circle2, index) => {
			if (circle1.id != circle2.id) {
				dx = circle2.x - circle1.x;
				dy = circle2.y - circle1.y;
				distance = Math.sqrt(dx * dx + dy * dy);

				if (distance < (circle2.r + circle1.r)) {
					if (circle2.r > circle1.r) {
						//circle1 dies
			    		circle2.r += circle1.r;
						circles = circles.filter(function(candidate) {
							return candidate.id !== circle1.id;
						});
					} else if (circle2.r < circle1.r) {
						//circle2 dies
			    		circle1.r += circle2.r;
						circles = circles.filter(function(candidate) {
							return candidate.id !== circle2.id;
						});
					}
				}
			}
		});
		cookies.forEach((cookie, index) => {
			dx = circle1.x - cookie[0];
			dy = circle1.y - cookie[1];
			distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < (circle1.r + COOKIE_RADIUS)) {
			    cookies.splice(index, 1);
			    createCookie();
			    circle1.r += 1;
			}
		});
	});
}

http.listen(PORT, () => {
	console.log('We are up on 3000');
});