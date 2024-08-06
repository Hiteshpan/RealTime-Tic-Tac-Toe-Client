import React, { useEffect, useState } from "react";
import "./App.css";
import Square from "./Square/Square";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const renderFrom = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

const App = () => {
  const [gameState, setGameState] = useState(renderFrom);
  const [currentPlayer, setCurrentPlayer] = useState("circle");
  const [finishedState, setFinishedState] = useState(false);
  const [finishedArrayState, setFinishedArrayState] = useState([]);
  const [playOnline, setPlayOnline] = useState(false);
  const [socket, setSocket] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [opponentName, setOpponentName] = useState(null);
  const [playingAs, setPlayingAs] = useState(null);

  const checkWinner = () => {
    //row dynamic
    for (let row = 0; row < gameState.length; row++) {
      if (
        gameState[row][0] === gameState[row][1] &&
        gameState[row][1] === gameState[row][2]
      ) {
        setFinishedArrayState([row * 3 + 0, row * 3 + 1, row * 3 + 2]);
        return gameState[row][0];
      }
    }
    //col dynamic
    for (let col = 0; col < gameState.length; col++) {
      if (
        gameState[0][col] === gameState[1][col] &&
        gameState[1][col] === gameState[2][col]
      ) {
        setFinishedArrayState([0 * 3 + col, 1 * 3 + col, 2 * 3 + col]);
        return gameState[0][col];
      }
    }
    // Check main diagonal
    if (
      gameState[0][0] === gameState[1][1] &&
      gameState[1][1] === gameState[2][2] &&
      (gameState[0][0] === "circle" || gameState[0][0] === "cross")
    ) {
      setFinishedArrayState([0, 4, 8]);
      return gameState[0][0];
    }
    // Check anti-diagonal
    if (
      gameState[0][2] === gameState[1][1] &&
      gameState[1][1] === gameState[2][0] &&
      (gameState[0][2] === "circle" || gameState[0][2] === "cross")
    ) {
      setFinishedArrayState([2, 4, 6]);
      return gameState[0][2];
    }

    const isDrawMatch = gameState.flat().every((e) => {
      if (e === "circle" || e === "cross") return true;
    });
    if (isDrawMatch) return "draw";

    return null;
  };

  useEffect(() => {
    const winner = checkWinner();
    if (winner) {
      setFinishedState(winner);
    }
  }, [gameState]);

  const takePlayerName = async () => {
    const result = await Swal.fire({
      title: "Enter Your Name",
      input: "text",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      },
    });

    return result;
  };

  socket?.on("opponentLeftMatch", () => {
    setFinishedState("opponentLeftMatch");
  });

  socket?.on("playerMoveFromServer", (data) => {
    const id = data.state.id;
    setGameState((prevState) => {
      let newState = [...prevState];
      const rowIndex = Math.floor(id / 3);
      const colIndex = id % 3;
      newState[rowIndex][colIndex] = data.state.sign;
      return newState;
    });

    setCurrentPlayer(data.state.sign === "circle" ? "cross" : "circle");
  });

  socket?.on("connect", function () {
    setPlayOnline(true);
  });

  socket?.on("OpponentNotFound", function () {
    setOpponentName(false);
  });

  socket?.on("OpponentFound", function (data) {
    setPlayingAs(data.playingAs);
    setOpponentName(data.opponentName);
  });

  async function playOnlineClick() {
    const result = await takePlayerName();

    if (!result.isConfirmed) {
      return;
    }

    const username = result.value;
    setPlayerName(username);

    const newSocket = io(SERVER_URL, {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play", {
      playerName: username,
    });

    setSocket(newSocket);
  }

  if (!playOnline) {
    return (
      <div className="main-div center">
        <button onClick={playOnlineClick} className="playOnline">
          Play Online
        </button>
      </div>
    );
  }

  if (playOnline && !opponentName) {
    return <h1 className="wait">Wating for opponent ...</h1>;
  }

  return (
    <div className="main-div">
      <div className="move-detection">
        <div
          className={`left ${
            currentPlayer === playingAs ? "current-move-" + currentPlayer : ""
          }`}
        >
          {playerName}
        </div>
        <div
          className={`right ${
            currentPlayer !== playingAs ? "current-move-" + currentPlayer : ""
          }`}
        >
          {opponentName}
        </div>
      </div>
      <div>
        <h1 className=" game-heading water-background">Tic Tac Toe</h1>
        <div className="square-wrapper">
          {gameState.map((arr, rowIndex) => {
            return arr.map((e, colIndex) => {
              return (
                <Square
                  playingAs={playingAs}
                  gameState={gameState}
                  socket={socket}
                  finishedArrayState={finishedArrayState}
                  finishedState={finishedState}
                  currentPlayer={currentPlayer}
                  setCurrentPlayer={setCurrentPlayer}
                  setGameState={setGameState}
                  id={rowIndex * 3 + colIndex}
                  key={rowIndex * 3 + colIndex}
                  currentElement={e}
                />
              );
            });
          })}
        </div>
        {finishedState &&
          finishedState !== "opponentLeftMatch" &&
          finishedState !== "draw" && (
            <h3 className="finished-state">
              {/* " {finishedState === playingAs ? " You " : finishedState} " won
              the Game !!! */}

             {finishedState === playingAs
                ? `You won the Game !!!`
                : `" ${
                    finishedState === "circle"
                      ? ( playingAs === "circle"
                        ? playerName
                        : opponentName )
                      : ( playingAs === "cross"
                      ? playerName
                      : opponentName )
                  } " won the Game !!!`} 
            </h3>
          )}
        {finishedState &&
          finishedState !== "opponentLeftMatch" &&
          finishedState === "draw" && (
            <h3 className="finished-state">It's a Draw !!!</h3>
          )}

        {!finishedState && opponentName && (
          <h3 className="against-state">
            You are playing against : " {opponentName} "
          </h3>
        )}

        {finishedState && finishedState === "opponentLeftMatch" && (
          <h3 className="against-state">
            You won the Match , {opponentName} has left !!!
          </h3>
        )}
      </div>
    </div>
  );
};

export default App;
