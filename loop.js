var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;
var TILESIZE = 16;
var levels = new Array(16);

currentLevel = levels[0];

map = [[]];
for(x=0;x<(0,640/16);x++) {
    map[x] = new Array(480/16);
}
map[1][1] = 1;
for(x=0;x<5;x++) {
    map[x+10][10] = 1;
    map[x+14][9] = 1;
    map[x+3][13] = 1;
    map[x+7][12] = 1;
    map[x*2][20] = 1;
}
map[2][12] = 1;


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

function resetGame()
{
    x = 64;
    y = 64;
    yvel = 1;
    grounded = false;
}

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("person");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    return true;
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    // Draw tiles
    ctx.fillStyle = "#ffffff";

   for(cx=0;cx<640/TILESIZE;cx++) {
	for(cy=0;cy<480/TILESIZE;cy++) {
	    if(map[cx][cy] == 1) {
		ctx.fillRect(cx*TILESIZE, cy*TILESIZE, TILESIZE, TILESIZE);
		}
	    }
	}

    ctx.drawImage(playerImage, x, y);

    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}


function risefall(dy)
{
    x1 = Math.floor(x/TILESIZE);
    x2 = Math.floor((x+TILESIZE-1)/TILESIZE);
    gridy = Math.floor(y/TILESIZE)+dy;
    if(y % TILESIZE == 0) {
	
	ground1 = map[x1][gridy]
	ground2 = map[x2][gridy]
	if(ground1 == 1 || ground2 == 1) {
	    grounded = true;
	    return false;
	}
    }

    grounded = false;
    y += dy;
    return true;
}

function action()
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

function moveX(dx)
{
    if(x % TILESIZE == 0) {
	gx = Math.floor(x/TILESIZE);
	gy = Math.floor(y/TILESIZE);
	gy2 = Math.floor((y+TILESIZE-1)/TILESIZE);
	if(dx < 0) gx -= 1;
	if(dx > 0) gx += 1;
	if(map[gx][gy] == 1 || map[gx][gy2] == 1) {
	    return false;
	}
     }
    x += dx;
}

function processKeys() {
    if(keysDown[37] || keysDown[65]) moveX(-4);
    if(keysDown[39] || keysDown[68]) moveX(4);
    if(keysDown[32] & grounded) { yvel = -4; grounded = false; }
    if(x < 0) x = 0;
    if(x > SCREENWIDTH - playerImage.width)  x = SCREENHEIGHT - playerImage.width;
    if(y < 0) y = 0;
    if(y > SCREENWIDTH - playerImage.height) y = SCREENHEIGHT - playerImage.height;
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
	action();
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
