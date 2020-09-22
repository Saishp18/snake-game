const io = require('socket.io')();
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');
var mysql = require('mysql');

const state = {};
const clientRooms = {};

var scores = [];
var isInitScores = false;

// Define our db creds
var db = mysql.createConnection({
  host: 'remotemysql.com',
  user: 'wB310sgcuj',
  database: 'wB310sgcuj',
  password: 'vAt1fPRr7Z'
})

// Log any errors connected to the db
db.connect(function(err){
  if (err) console.log(err)
})

io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);
  client.on('new user', handleNewUser);
  client.on('initialScores', handleScores);

  function handleNewUser(data){
    let user=data.user;
    let pwd=data.pwd;
    let score=data.highScore; 
  
  
    db.query("Select name from users where name = ? and password = ?", [user,pwd], function (err, result) {
      if (err) throw err;
      if(result.length > 0){
        db.query("Update users set score = ? where name = ?", [score, user]);
        console.log("update"+user+"  "+pwd+"  "+score);
      }
      else{
        db.query("INSERT INTO users (name, password, score) VALUES (?, ?, ?)", [user,data.pwd,data.highScore]);
        console.log("insert"+user+"  "+pwd+"  "+score);
      }
    });
  }


  function handleScores(temp){
    client.emit('initialScores', scores)
  }

      if (! isInitScores) {
        // Initial app start, run db query
        db.query('SELECT * FROM users order by score desc LIMIT 5')
            .on('result', function(data){
                scores.push(data)
            })
            .on('end', function(){
                client.emit('initialScores', scores)
                // console.log(scores);
            })
            
        isInitScores = true
    } else {
        client.emit('initialScores', scores)
        // console.log(scores)
    }

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);
    
    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
  }
 
  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return; 
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);
    
    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(3000);
