const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let board = Array(9).fill(null);
let currentPlayer = "X";

// Serve the HTML page
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tic Tac Toe</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      text-align: center;
    }
    #board {
      display: grid;
      grid-template-columns: repeat(3, 100px);
      grid-gap: 5px;
      justify-content: center;
    }
    #board div {
      width: 100px;
      height: 100px;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Tic Tac Toe</h1>
  <div id="board"></div>
  <p id="message"></p>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const board = document.getElementById("board");
    const message = document.getElementById("message");

    let currentPlayer = "";
    let playerSymbol = "";

    socket.on("init", (data) => {
      currentPlayer = data.currentPlayer;
      playerSymbol = data.symbol;
      message.textContent = \`You are \${playerSymbol}. \${currentPlayer}'s turn.\`;
    });

    socket.on("updateBoard", (data) => {
      board.innerHTML = "";
      data.board.forEach((cell, index) => {
        const cellDiv = document.createElement("div");
        cellDiv.textContent = cell;
        cellDiv.addEventListener("click", () => makeMove(index));
        board.appendChild(cellDiv);
      });
      message.textContent = data.message;
    });

    socket.on("gameOver", (msg) => {
      message.textContent = msg;
    });

    function makeMove(index) {
      socket.emit("makeMove", { index });
    }
  </script>
</body>
</html>
  `);
});

// Socket.IO logic
io.on("connection", (socket) => {
  const symbol = io.sockets.sockets.size % 2 === 0 ? "X" : "O";

  socket.emit("init", { symbol, currentPlayer });

  socket.on("makeMove", ({ index }) => {
    if (board[index] === null) {
      board[index] = currentPlayer;
      currentPlayer = currentPlayer === "X" ? "O" : "X";
      const winner = checkWinner();
      io.emit("updateBoard", {
        board,
        message: winner ? `${winner} wins!` : `${currentPlayer}'s turn.`,
      });
      if (winner) io.emit("gameOver", `${winner} wins!`);
    }
  });
});

function checkWinner() {
  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
