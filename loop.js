var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;
var TILESIZE = 32;
var levels = new Array(16);
var EVAPSTEP = 4; // Make this bigger to slow evaporation
var PRESSURE = 16; // Water pressure

// Tile types:
var EMPTY = 0;
var BRICK = 1;
var ICE = 2;
var LADDER = 3;
var WATER = 4;

flash = "";
tileColours = [ "#000000", "#ffffff", "#0000cf" ];
function Robot(sx,sy)
{
    this.x = sx;
    this.y = sy;
    this.maxx = 640-TILESIZE;
    this.maxy = 480-TILESIZE;
    this.minx = 0;
    this.miny = 0;
    this.dx = 4;
    this.dy = 0;
    this.xsize = 32;
    this.ysize = 32;
    this.colour = "#ff0000";
    this.health = 32;
}

function Level()
{
    this.map = [];
    this.water = [];
    var x,y;
    for(x=0;x<640/TILESIZE;x++) {
	this.map[x] = new Array(480/TILESIZE);
	this.water[x] = new Array(480/TILESIZE);
	for(y=0;y<480/TILESIZE;y++) {
	    this.map[x][y] = 0;
	    this.water[x][y] = 0;
	}
    }
    this.robots = [];
    this.robots.push(new Robot(32,128))
    this.exitX = 480-TILESIZE;
    this.exitY = 0;

    request = new XMLHttpRequest();
    request.open("GET", "level1.csv",false); // Blocking
    request.send(null);
    console.log(request.responseText);

    // Now parse that...
    lineArray = request.responseText.split("\n");
    for(var l = 0;l< 480/TILESIZE; l++) {
        line = lineArray[l];
        charArray = line.split(",");
        if(charArray.length>1) {
          for(var c=0;c<640/TILESIZE;c++) {
            this.map[c][l] = parseInt(charArray[c])-1;
          }
        }
    }
    cold = false;
}

function Particle(x,y,xvel,yvel)
{
    this.x = x; this.y = y;
    this.xvel = xvel; this.yvel = yvel;
    this.colour = "#7f0000";
}

function getImage(name)
{
    image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetPlayer()
{
    px = 128;
    py = 64;
    yvel = 1;
    grounded = false;
    aimAngle = 0;
    aimDirection = 1;
}

function resetGame()
{
    resetPlayer();
    waterParticles = [];
    drips = [];
    frameCounter = 0;
    currentLevel = new Level();
    waterLevel = 128;
    flash = "";
    particles = [];
}


function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("person");
    gunImage = getImage("watergun");
    bottleImage = getImage("bottle");
    robotImage = getImage("robot");
    brickImage = getImage("brick");
    iceImage = getImage("ice");
    waterImage = getImage("water");
    ladderImage = getImage("ladder");
    tileImages = [ 0, brickImage, iceImage, ladderImage, waterImage ];
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    return true;
}

function draw() {
    if(flash != "") {
	ctx.fillStyle = flash;
	flash = "";
    }
    else {
	ctx.fillStyle = "#00003f";
    }

    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    // Draw tiles
    ctx.fillStyle = "#ffffff";

   for(cx=0;cx<640/TILESIZE;cx++) {
       for(cy=0;cy<480/TILESIZE;cy++) {
	   ctx.fillStyle = tileColours[currentLevel.map[cx][cy]];
	   if(currentLevel.map[cx][cy] > 0) {
	       ctx.drawImage(tileImages[currentLevel.map[cx][cy]],cx*TILESIZE, cy*TILESIZE);
	   } else {
	       ctx.fillRect(cx*TILESIZE, cy*TILESIZE, TILESIZE, TILESIZE);
	   }
       }
   }
    
    ctx.drawImage(playerImage, px, py);
    ctx.save();
    ctx.translate(px+TILESIZE/2,py+TILESIZE);
    ctx.rotate(aimAngle*aimDirection);
    ctx.scale(0.7*aimDirection,0.7);
    ctx.translate(0,0);
    ctx.drawImage(gunImage, 0, -16);
    ctx.restore();

    ctx.fillStyle = "#7f7fff";

    displayWaterLevel = waterLevel / 4;
    if(displayWaterLevel > 4) {
	ctx.fillRect(640-32-8+4,8,Math.min(displayWaterLevel-4, 24), 16);
    }
    ctx.fillRect(640-32-8,12, displayWaterLevel, 8);

    ctx.drawImage(bottleImage, 640-32-8, 8);


    for(i=0;i<waterParticles.length;i++) {
	ctx.fillRect(waterParticles[i][0], waterParticles[i][1], 4,4);
    }
    for(i=0;i<drips.length;i++) {
	ctx.fillRect(drips[i][0], drips[i][1], 4,4);
    }

    for(i=0;i<currentLevel.robots.length;i++) {
	r = currentLevel.robots[i];
	ctx.drawImage(robotImage, r.x, r.y);
	ctx.fillStyle = r.colour;
    }

    for(i=0;i<particles.length;i++) {
	console.log("Draw particle at "+p.x+","+p.y);
	p = particles[i];
	ctx.fillStyle = p.colour;
	ctx.fillRect(p.x, p.y, 4, 4);
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(currentLevel.exitX, currentLevel.exitY, 64,64);

    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }

}


function risefall(dy)
{
    x1 = Math.floor(px/TILESIZE);
    x2 = Math.floor((px+TILESIZE-1)/TILESIZE);
    if(dy>0) { gridy = Math.floor(py/TILESIZE)+2; }
    else { gridy = Math.floor((py-1)/TILESIZE); }
    if(py % TILESIZE == 0) {
	ground1 = currentLevel.map[x1][gridy]
	ground2 = currentLevel.map[x2][gridy]
	if(solid(ground1) || solid(ground2) || (ground1==LADDER || ground2 == LADDER) && dy>0 && !keysDown[83]) {
	    if(dy > 0 ) grounded = true;
	    return false;
	}
    }

    grounded = false;
    py += dy;
    return true;
}

function waterLand(gx,gy) {
    if(currentLevel.map[gx][gy] == 0) {
	currentLevel.water[gx][gy] += 1;
	if(currentLevel.water[gx][gy] >= 16 && currentLevel.cold) {
	    currentLevel.map[gx][gy] = ICE;
	}
    }
    addDrip(gx,gy,true);
}

function addDrip(gx, gy, base) {
    if(Math.random() < 0.5) {
	if(base) {
	    drips.push([gx*TILESIZE+Math.random()*TILESIZE, gy*TILESIZE+TILESIZE, 0, -8]);
	    }
	else {
	    drips.push([gx*TILESIZE+Math.random()*TILESIZE, gy*TILESIZE+Math.random()*TILESIZE, 0, -8]);
	    }
    }
}

function evaporate(step)
{
    for(gx = step; gx < 640/TILESIZE; gx += EVAPSTEP) {
	for(gy = 0; gy < 480/TILESIZE; gy++) {
	    if(currentLevel.water[gx][gy] > 0) {
		currentLevel.water[gx][gy] -= 1;
	    }
	}
    }
}

function vertical()
{
    if(yvel < 0) {
	for(i=0;i<-yvel;i++) {
	    if(!risefall(-1)) {
		yvel = 0;
		return;
	    }
	}
    } else {
	for(i=0;i<yvel;i++) {
	    if(!risefall(1)) {
		yvel = 0;
		return;
	    }
	}
    }
    yvel += 1;

}

function hitRobot(wx, wy)
{
    var i;
    for(i=0;i<currentLevel.robots.length;i++) {
	r = currentLevel.robots[i];
	if(wx >= r.x && wx < (r.x+r.xsize) && wy >= r.y && wy < (r.y+r.ysize)) {
	    return i;
	}
    }
    return -1;
}

function action()
{
    vertical();
    // Water
    newWater = new Array();
    for(i=0;i<waterParticles.length;i++) {
	oldx = waterParticles[i][0];
	oldy = waterParticles[i][1];
	waterParticles[i][0] += waterParticles[i][2];
	waterParticles[i][1] += waterParticles[i][3];
	waterParticles[i][3] += 1;

	if(waterParticles[i][0] < 0 || waterParticles[i][0] >= 640 ||
	   waterParticles[i][1] < 0 || waterParticles[i][1] >= 480)
	    continue;
	gx = Math.floor(waterParticles[i][0] / TILESIZE);
	gy = Math.floor(waterParticles[i][1] / TILESIZE);
	if(currentLevel.map[gx][gy] == 1) { 
	    waterLand(Math.floor(oldx/TILESIZE), Math.floor(oldy/TILESIZE));
	} else {
	    j = hitRobot(waterParticles[i][0], waterParticles[i][1]);
	    if(j>-1) {
		addDrip(waterParticles[i][0]/TILESIZE, waterParticles[i][1]/TILESIZE, false);
		currentLevel.robots[j].health -= 1;
	    }
	    else {
		newWater.push(waterParticles[i]);
	    }
	}
    }
    waterParticles = newWater;
    newDrip = new Array();
    for(i=0;i<drips.length;i++) {
	if(drips[i][3] > 0) drips[i][1] += drips[i][3];
	drips[i][3] += 1;	
	if(drips[i][1] < 480) {
	    newDrip.push(drips[i]);
	}
    }
    evaporate(frameCounter % EVAPSTEP);

    newRobots = new Array();
    for(i=0;i<currentLevel.robots.length;i++) {
	r = currentLevel.robots[i];
	r.x += r.dx;
	r.y += r.dy;
	if(r.x >= r.maxx || r.x <= r.minx) r.dx = -r.dx;
	if(r.y >= r.maxy || r.y <= r.miny) r.dy = -r.dy;
	if(r.health > 0) {
	    newRobots.push(r);
	}
	else {
	    for(j=0;j<10;j++) {
		particles.push(new Particle(r.x + r.xsize/2, r.y+r.ysize/2, 8*Math.random()-4, -Math.random()*4));
	    }
	}
	if(hitRobot(px,py) > -1) {
	    flash = "#ff0000";
	    resetPlayer();
	}
    }
    currentLevel.robots = newRobots;

    newParticles = new Array();
    for(i=0;i<particles.length;i++) {
	p = particles[i];
	p.x += p.xvel;
	p.y += p.yvel;
	p.yvel += 1;
	if(p.y <= 480) {
	    newParticles.push(p);
	}
    }
    particles = newParticles;
    if(px >= currentLevel.exitX && px < currentLevel.exitX+64 && py >= currentLevel.exitY && py < currentLevel.exitY+64) {
	resetGame();
    }

    // Tile effects
    gx = Math.floor(px/TILESIZE);
    gy = Math.floor(py/TILESIZE)+1;
    if(currentLevel.map[gx][gy] == WATER) {
	waterLevel = 128;
    }
}

function solid(b)
{
    return b == BRICK || b == ICE;
}

function moveX(dx)
{
    if(px % TILESIZE == 0) {
	gx = Math.floor(px/TILESIZE);
	gy = Math.floor(py/TILESIZE);
	gy2 = Math.floor((py+TILESIZE-1)/TILESIZE);
	gy3 = Math.floor((py+TILESIZE*2-1)/TILESIZE);
	if(dx < 0) gx -= 1;
	if(dx > 0) gx += 1;
	if(solid(currentLevel.map[gx][gy]) || solid(currentLevel.map[gx][gy2]) || solid (currentLevel.map[gx][gy3])) {
	    return false;
	}
     }
    px += dx;
    aimDirection = Math.sign(dx);
}

function addWater()
{
    if(waterLevel > 0) {
	rangle = aimAngle + 0.1*(-0.5 + Math.random());
	waterParticles.push([px+TILESIZE/2, py+TILESIZE-8, aimDirection * Math.cos(rangle) * PRESSURE, Math.sin(rangle) * PRESSURE]);
	waterLevel -= 1;
    }
}

function processKeys() {
    if(keysDown[37] || keysDown[65]) moveX(-4);
    if(keysDown[39] || keysDown[68]) moveX(4);
    if(keysDown[32] & grounded) { yvel = -10; grounded = false; }
    if(keysDown[40] && aimAngle < Math.PI / 2) aimAngle += 0.1;
    if(keysDown[38] && aimAngle > -Math.PI / 2) aimAngle -= 0.1;
    if(keysDown[87]) addWater();
    if(keysDown[88]) waterLevel = 128; // Cheat code
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
	action();
	frameCounter += 1;
    }
    draw();
    if(!stopRunloop) setTimeout('drawRepeat()',20);
}

if (canvas.getContext('2d')) {
    stopRunloop = false;
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
        keysDown[c] = 1;
	if(c == 81) {
	    stopRunloop=true;
	    console.log("Loop exited");
	}
	if(c == 32) {
	    if(mode == MODE_TITLE) {
		resetGame();
		mode = MODE_PLAY;
	    }
	}
	if(c == 82) {
	    if(mode == MODE_WIN) {
		mode = MODE_TITLE;
	    }
	}
    };

    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    if(init()) {      
      drawRepeat();
    }
}
