const BG_COLOUR = '#231f20';
const SNAKE_COLOUR = '#c2c2c2';
const FOOD_COLOUR = '#e66916';

// const proxyurl = "https://cors-anywhere.herokuapp.com/";
const url = "https://afternoon-crag-87484.herokuapp.com/"; // site that doesn’t send Access-Control-*
// fetch(proxyurl + url) // https://cors-anywhere.herokuapp.com/https://example.com
// .then(response => response.text())
// .then(contents => console.log(contents))
// .catch(() => console.log("Can’t access " + url + " response. Blocked by browser?"))

const socket = io(url);

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('initialScores',handleScores);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const loginScreen = document.getElementById('loginScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);


function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}

let canvas, ctx, score=0;
let playerNumber;
let gameActive = false;
let userName, password;


function handleScores(data){
  console.log(data);
    var html = ''
    html += '<table border=1><tr><th>Rank</th><th>UserName</th><th>Score</th></tr>';
    for (var i = 0; i < data.length; i++){
        // We store html as a var then add to DOM after for efficiency
        html += '<tr><td>'+ (i+1) +'</td> <td>' + data[i].name + '</td><td>' + data[i].score + '</td></tr>'
    }
    html += '</table';
    $('#scores').html(html);
}


function login() {
  userName = document.getElementById("userName").value;
  password = document.getElementById("password").value;

  document.getElementById("demo").innerHTML = "Your Username:  " + userName;
  console.log(userName);
  loginScreen.style.display = "none";
  initialScreen.style.display = "block";
  }

function init() {

  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit('keydown', e.keyCode);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  document.getElementById('scoreDisplay1').innerHTML = state.players[0].score;
  document.getElementById('scoreDisplay2').innerHTML = state.players[1].score;
  scoreDisplay1 = state.players[0].score;
  scoreDisplay2 = state.players[1].score;

  score = state.players[playerNumber-1].score;
  state.players[playerNumber-1].userName = userName;
  // console.log(userName);

  ctx.fillStyle = FOOD_COLOUR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOUR);
  paintPlayer(state.players[1], size, 'red');
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  ctx.fillStyle = colour;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => paintGame(gameState));
}

function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    // score = state.players[playerNumber-1].score;
    console.log(score);
    socket.emit('new user', {user: userName, pwd: password, highScore: score});

    alert('You Win! Score='+ score);

   
  } else {
    alert('You Lose!');
  }
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleUnknownCode() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
