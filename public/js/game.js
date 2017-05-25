$(document).ready(function() {

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var name = localStorage.getItem('gameName');
	const INITIAL_RADIUS = 30;
	var startPositionX = canvas.width / 2;
	var startPositionY = canvas.height / 2;
	var socket = io({ query: "x=" + startPositionX + "&y=" + startPositionY + "&r=" + INITIAL_RADIUS + "&name=" + name});

	var enemies = [];
	var dead = [];
	socket.on('existing circles', function(circles){
		enemies = enemies.concat(circles);
		console.log(circles);
	});
	socket.on('new circle', function(newCircle){
		enemies.push(newCircle);
	});
	socket.on('move', function(moved){
		enemies.forEach((enemy, index) => {
			if (enemy.id == moved.id) {
				enemies[index] = moved;
			}
		});
	});
	socket.on('dead', function(id){
		if (id == socket.id) {
			gameOver();
		} else {
			killEnemy(id);
		}
	});
	socket.on('user disconnected', function(id){
		killEnemy(id);
	});

	// Game logic
	const COOKIE_RADIUS = 10;
	const NUMBER_OF_COOKIES = 20;
	var mouseX = startPositionX;
	var mouseY = startPositionY;
	var circleX = startPositionX;
	var circleY = startPositionY;
	var circleRadius = INITIAL_RADIUS;
	var moveX, moveY = 0;
	var cookies = [];
	var cookieX, cookieY;
	var dx, dy, distance;
	var score = 0;
	var nameSize;
	var circleColor = "#990000";
	var colors = ["blue", "red", "green", "yellow"];
	var color;
	var isAlive = true;

	// Populate cookies array
	for(i = 0; i < NUMBER_OF_COOKIES; i++) {
		createCookie();
	}

	canvas.addEventListener("mousemove", setMousePosition, false);

	function setMousePosition(e) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function setCirclePosition() {
		moveX = (mouseX - circleX) / 100;
		moveY = (mouseY - circleY) / 100;
		circleX += moveX;
		circleY += moveY;
		if (isAlive) {
			socket.emit('move', {
				id: socket.id,
				x: circleX,
				y: circleY,
				r: circleRadius,
				name: name
			});
		}
	}

	function checkCollisions() {
		cookies.forEach((cookie, index) => {
			dx = circleX - cookie[0];
			dy = circleY - cookie[1];
			distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < (circleRadius + COOKIE_RADIUS)) {
			    cookies.splice(index, 1);
			    createCookie();
			    score += 1;
			    circleRadius += 1;
			}
		});
	}

	function createCookie() {
		cookieX = Math.random() * canvas.width;
		cookieY = Math.random() * canvas.height;
		color = colors[Math.floor(Math.random() * colors.length)];
		cookies.push([cookieX, cookieY, color]);
	}

	function drawCircle(x, y, r, playerName) {
		ctx.beginPath();
		ctx.arc(x,y,r,0,2*Math.PI);
		ctx.fillStyle = circleColor;
		ctx.fill();

		ctx.beginPath();
		nameSize = r - INITIAL_RADIUS;
		nameSize = nameSize < 16 ? 16 : nameSize;
        ctx.font = 'bold ' + nameSize + 'px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(playerName, x, y + nameSize/2);
	}

	function drawEnemies() {
		enemies.forEach((enemy, index) => {
			drawCircle(enemy.x, enemy.y, enemy.r, enemy.name);
		});
	}

	function gameOver() {
		isAlive = false;
		window.location.href = '/dead';
	}

	function killEnemy(id) {
		enemies = enemies.filter(function(enemy) {
			return enemy.id !== id;
		});
	}

	function update() {
		setCirclePosition();
		checkCollisions();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		cookies.forEach((cookie, index) => {
			ctx.beginPath();
			ctx.arc(cookie[0],cookie[1],COOKIE_RADIUS,0,2*Math.PI);
			ctx.fillStyle = cookie[2];
			ctx.fill();
		});
		drawCircle(circleX, circleY, circleRadius, name);
		drawEnemies();

		requestAnimationFrame(update);
	}

	requestAnimationFrame(update);

});