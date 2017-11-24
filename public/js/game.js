$(document).ready(function() {

	var canvas = document.getElementById("gameCanvas");
	var ctx = canvas.getContext("2d");

	//make canvas fullscreen
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	const WORLD_WIDTH = 4000;
	const WORLD_HEIGHT = 3000;
	var myName = localStorage.getItem('gameName');
	const START_POSITION_X = WORLD_WIDTH / 2;
	const START_POSITION_Y = WORLD_HEIGHT / 2;
	const INITIAL_RADIUS = 30;
	var minX, maxX, minY, maxY;
	var socket = io({ query: "&name=" + myName});

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
	socket.on('game update', function(cookiesAndCircles){
		cookies = cookiesAndCircles.cookies;
		enemies = cookiesAndCircles.circles.filter(function(circle) {
			return circle.id !== myCircle.id;
		});
		// get my circle
		var myCircleArray = cookiesAndCircles.circles.filter(function(circle) {
			return circle.id == myCircle.id;
		});
		if (myCircleArray == undefined || myCircleArray.length == 0) {
			gameOver();
		} else {
			myCircle.r = myCircleArray[0].r;
		}
	});

	var sentTime = Date.now();
	var lag = 0;
	setInterval(function() {
		sentTime = Date.now();
		socket.emit('ping', 'Ping');
	}, 500);
	socket.on('pong', function(data){
		lag = Date.now() - sentTime;
	});

	// Game logic
	const COOKIE_RADIUS = 10;
	var mouseX = START_POSITION_X;
	var mouseY = START_POSITION_Y;
	var moveX = 0;
	var moveY = 0;
	var cookies = [];
	var dx, dy, distance;
	var score = 0;
	var nameSize;
	var circleColor = "#990000";
	var isAlive = true;
	var lastUpdateTime = Date.now();

	canvas.addEventListener("mousemove", setMousePosition, false);

	function setMousePosition(e) {
		mouseX = e.clientX - camX;
		mouseY = e.clientY - camY;
		moveX = (mouseX - myCircle.x) / 1500;
		moveY = (mouseY - myCircle.y) / 1500;
	}

	function setCirclePosition(now) {
		var deltaTime = now - lastUpdateTime;
		var newPosX = myCircle.x + (moveX*deltaTime);
		var newPosY = myCircle.y + (moveY*deltaTime);
		lastUpdateTime = now;
		minX = myCircle.r;
		maxX = WORLD_WIDTH - myCircle.r;
		minY = myCircle.r;
		maxY = WORLD_HEIGHT - myCircle.r;

		if (newPosX < minX) {
			myCircle.x = minX;
		} else if (newPosX > maxX) {
			myCircle.x = maxX;
		} else {
			myCircle.x = newPosX;
		}
		if (newPosY < minY) {
			myCircle.y = minY;
		} else if (newPosY > maxY) {
			myCircle.y = maxY;
		} else {
			myCircle.y = newPosY;
		}
	}

	function emitMove() {
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

        // show lag
        $('#lag').text(lag + 'ms');
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

	function update() {
		setCirclePosition(Date.now());
		draw();

		requestAnimationFrame(update);
	}
	requestAnimationFrame(update);

	// send my move loop
	setInterval(function() {
		emitMove();
	}, 1000/66);

	var camX, camY;
	function draw() {
		ctx.setTransform(1,0,0,1,0,0); // reset the transform matrix as it is cumulative
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (myCircle.x - canvas.width/2 >= 0 && myCircle.x + canvas.width/2 <= WORLD_WIDTH) {
			camX = -myCircle.x + canvas.width/2;
		}
		if (myCircle.y - canvas.height/2 >= 0 && myCircle.y + canvas.height/2 <= WORLD_HEIGHT) {
			camY = -myCircle.y + canvas.height/2;
		}
		ctx.translate(camX, camY);
		cookies.forEach((cookie, index) => {
			ctx.beginPath();
			ctx.arc(cookie[0],cookie[1],COOKIE_RADIUS,0,2*Math.PI);
			ctx.fillStyle = cookie[2];
			ctx.fill();
		});
		drawCircle(myCircle.x, myCircle.y, myCircle.r, myName);
		drawEnemies();
	}

});