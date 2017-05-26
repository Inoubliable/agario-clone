$(document).ready(function() {

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var myName = localStorage.getItem('gameName');
	const INITIAL_RADIUS = 30;
	const START_POSITION_X = canvas.width / 2;
	const START_POSITION_Y = canvas.height / 2;
	var socket = io({ query: "x=" + START_POSITION_X + "&y=" + START_POSITION_Y + "&r=" + INITIAL_RADIUS + "&name=" + myName});

	var enemies = [];
	var myCircle = {
		x: START_POSITION_X,
		y: START_POSITION_Y,
		r: INITIAL_RADIUS,
		name: myName
	};
	socket.on('my circle', function(circle){
		myCircle = circle;
	});
	socket.on('game update', function(circles){
		enemies = circles.filter(function(circle) {
			return circle.id !== myCircle.id;
		});
		var myCircleArray = circles.filter(function(circle) {
			return circle.id == myCircle.id;
		});
		myCircle = myCircleArray[0];
		if (!myCircle) {
			gameOver();
		}
	});

	// Game logic
	const COOKIE_RADIUS = 10;
	const NUMBER_OF_COOKIES = 20;
	var mouseX = START_POSITION_X;
	var mouseY = START_POSITION_Y;
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
		moveX = (mouseX - myCircle.x) / 100;
		moveY = (mouseY - myCircle.y) / 100;
		myCircle.x += moveX;
		myCircle.y += moveY;
	}

	function checkCollisions() {
		cookies.forEach((cookie, index) => {
			dx = myCircle.x - cookie[0];
			dy = myCircle.y - cookie[1];
			distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < (myCircle.r + COOKIE_RADIUS)) {
			    cookies.splice(index, 1);
			    createCookie();
			    score += 1;
			    myCircle.r += 1;
			}
		});
		if (isAlive) {
			socket.emit('move', myCircle);
		}
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

	function createCookie() {
		cookieX = Math.random() * canvas.width;
		cookieY = Math.random() * canvas.height;
		color = colors[Math.floor(Math.random() * colors.length)];
		cookies.push([cookieX, cookieY, color]);
	}

	function gameOver() {
		isAlive = false;
		window.location.href = '/dead';
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
		drawCircle(myCircle.x, myCircle.y, myCircle.r, myName);
		drawEnemies();

		requestAnimationFrame(update);
	}

	requestAnimationFrame(update);

});