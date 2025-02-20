import { createSignal, onCleanup, createEffect, onMount } from 'solid-js';
import styles from '../styles/Game.module.css';
import { cellColorMapping, isGameCompleted, findConnectedCells, getPipeConnections, getPipePath, isEdgePipe, convertBoardToGrid } from '../utils/gameUtils';
import { useGlobalData } from '../Context';
import { incrementScore, leaveLobby, socket } from '../utils/websocket';
import { useNavigate, useParams } from '@solidjs/router';
import Header from './Header';

function Game() {
    const navigate = useNavigate();
    const { userID, setUserID, lobby, setLobby } = useGlobalData();
    const { lobbyId } = useParams();

    if (!userID()) {
        navigate('/');
        return;
    }

    const players = () => Object.entries(lobby()['players']);
    const playerOne = () => players()[0][1];
    const playerTwo = () => players().length > 1 ? players()[1][1] : null;

    const [currentGridIndex, setCurrentGridIndex] = createSignal(0);
    const currentGrid = () => convertBoardToGrid(lobby()['boards'][currentGridIndex()]);
    const n = () => currentGrid()[0].length;

    const [gridWidth, setGridWidth] = createSignal(
        Math.min(window.innerHeight * 0.7, window.innerWidth * 0.9, 1000)
    );
    const cellSize = () => (gridWidth() / n());
    createEffect(() => {
        const updateGridWidth = () => {
            setGridWidth(
                Math.min(window.innerHeight * 0.7, window.innerWidth * 0.9, 1000)
            );
        };
        window.addEventListener("resize", updateGridWidth);
        return () => window.removeEventListener("resize", updateGridWidth);
    });

    const [pipes, setPipes] = createSignal(
        Array(n()).fill().map(() => Array(n()).fill(null))
    );
    const [dragging, setDragging] = createSignal(false);
    const [dragColor, setDragColor] = createSignal(null);
    const [currentPath, setCurrentPath] = createSignal([]);

    const [playerOneScore, setPlayerOneScore] = createSignal(0);
    const [playerTwoScore, setPlayerTwoScore] = createSignal(0);
    const [timeLeft, setTimeLeft] = createSignal(lobby()['game_time']);
    const [gameOver, setGameOver] = createSignal(false);

    createEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t > 1) return t - 1;
                setGameOver(true);
                return 0;
            });
        }, 1000);
        onCleanup(() => clearInterval(timer));
    });

    createEffect(() => {
        const current = currentGrid();
        const currentPipes = pipes();
        const index = currentGridIndex();
        if (isGameCompleted(current, currentPipes)) {
            incrementScore(lobbyId, userID());
            if (index < lobby()['boards'].length - 1) {
                setCurrentGridIndex(index + 1);
                setPipes(Array(n()).fill().map(() => Array(n()).fill(null)));
                cancelDrag();
            }
        }
    });

    const formattedTime = () => {
        const minutes = Math.floor(timeLeft() / 60);
        const seconds = timeLeft() % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleStart = (row, col) => (e) => {
        e.preventDefault();
        const value = currentGrid()[row][col];
        const currentColor = cellColorMapping[value];
        const cellPipe = pipes()[row][col];

        if (value === 0 && cellPipe === null) return;

        if (cellPipe !== null && cellPipe.color === currentColor) {
            removePipesAt(row, col, currentColor);
        } else {
            removeIncompletePaths(currentColor);
            setDragging(true);
            setDragColor(currentColor || pipes()[row][col].color);
            if (cellPipe === null) {
                setCurrentPath([{ row, col }]);
            } else if (isEdgePipe(row, col, pipes)) {
                const path = [];
                const color = cellPipe.color;
                findConnectedCells(row, col, color, path, pipes, setPipes, n());
                setCurrentPath(path.reverse());
            }
        }
    };

    const handleMove = (row, col) => (e) => {
        e.preventDefault();
        if (!dragging()) return;

        const path = currentPath();
        if (path.length === 0) return;

        const inCurrentPath = path.slice(0, -1).some(cell => cell.row === row && cell.col === col);
        if (inCurrentPath) {
            setCurrentPath(path.slice(0, -1));
            return;
        }

        const lastCell = path[path.length - 1];
        const isAdjacent = (
            (Math.abs(lastCell.row - row) === 1 && lastCell.col === col) ||
            (Math.abs(lastCell.col - col) === 1 && lastCell.row === row)
        );
        if (!isAdjacent) return;

        if (path.filter(cell => currentGrid()[cell.row][cell.col] !== 0).length >= 2) return;

        const cellValue = currentGrid()[row][col];
        if (cellValue !== 0 && cellColorMapping[cellValue] !== dragColor()) {
            return;
        }

        const cellPipe = pipes()[row][col];
        if (cellPipe && cellPipe.color !== dragColor()) {
            return;
        }

        if (path.some(cell => cell.row === row && cell.col === col)) return;

        setCurrentPath([...path, { row, col }]);
    };

    const commitDrag = () => {
        const path = currentPath();
        if (path.length < 2) {
            cancelDrag();
            return;
        }

        const newPipes = pipes().map(row => [...row]);
        const color = dragColor();

        for (let i = 0; i < path.length; i++) {
            const { row, col } = path[i];
            const connections = getPipeConnections(row, col, path, pipes);
            newPipes[row][col] = { color, connections };
        }

        setPipes(newPipes);
        cancelDrag();
    };

    const cancelDrag = () => {
        setDragging(false);
        setDragColor(null);
        setCurrentPath([]);
    };

    const removeIncompletePaths = (color) => {
        const newPipes = pipes().map(row => [...row]);
        for (let row = 0; row < n(); row++) {
            for (let col = 0; col < n(); col++) {
                if (newPipes[row][col]?.color === color) {
                    newPipes[row][col] = null;
                }
            }
        }
        setPipes(newPipes);
    };

    const removePipesAt = (row, col, color) => {
        const newPipes = pipes().map(row => [...row]);
        const queue = [{ row, col }];

        while (queue.length > 0) {
            const { row: r, col: c } = queue.shift();
            if (newPipes[r][c]?.color === color) {
                const connections = newPipes[r][c].connections;
                newPipes[r][c] = null;

                if (connections.top) queue.push({ row: r - 1, col: c });
                if (connections.right) queue.push({ row: r, col: c + 1 });
                if (connections.bottom) queue.push({ row: r + 1, col: c });
                if (connections.left) queue.push({ row: r, col: c - 1 });
            }
        }

        setPipes(newPipes);
    };

    const handleLobbyReturn = () => {
        navigate('/lobby/' + lobbyId);
    };

    const handleLeaveGame = () => {
        leaveLobby(lobbyId, userID());
        navigate('/');
    }

    socket.on('score_updated', (data) => {
        const playerOneId = Object.entries(lobby()['players'])[0][0];
        if (data.user_id === playerOneId) {
            setPlayerOneScore(data.score);
        } else {
            setPlayerTwoScore(data.score);
        }
    });

    onCleanup(() => {
        window.removeEventListener('pointerup', commitDrag, { passive: false });
    });

    window.addEventListener('pointerup', commitDrag, { passive: false });

    return (
        <>
            {
                gameOver() ? (
                    <div class={styles.Game}>
                        <Header />
                        <div class={styles.gameOver}>
                            <div class={styles.gameOverTitle}>Game Over!</div>
                            <div className={styles.winner}>
                                {playerTwo() === null
                                    ? `Score: ${playerOneScore()}`
                                    : playerOneScore() > playerTwoScore()
                                        ? `${playerOne()['username']} wins!`
                                        : playerTwoScore() > playerOneScore()
                                            ? `${playerTwo()['username']} wins!`
                                            : "It's a tie!"}
                            </div>
                            {
                                playerTwo() !== null && (
                                    <div class={styles.scores}>
                                        {
                                            playerOneScore() > playerTwoScore() ? (
                                                <>
                                                    <div style={{ color: playerOne()['color'] }}>
                                                        {playerOne()['username']}: <span style={{ "font-weight": 900 }}>{playerOneScore()}</span>
                                                    </div>
                                                    <div style={{ color: playerTwo()['color'] }}>
                                                        {playerTwo()['username']}: <span style={{ "font-weight": 900 }}>{playerTwoScore()}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div style={{ color: playerTwo()['color'] }}>
                                                        {playerTwo()['username']}: <span style={{ "font-weight": 900 }}>{playerTwoScore()}</span>
                                                    </div>
                                                    <div style={{ color: playerOne()['color'] }}>
                                                        {playerOne()['username']}: <span style={{ "font-weight": 900 }}>{playerOneScore()}</span>
                                                    </div>
                                                </>
                                            )
                                        }
                                    </div>
                                )
                            }
                        </div>
                        <button class={styles.lobbyReturnBtn} onClick={handleLobbyReturn}>
                            Return to Lobby
                        </button>
                        <button class={styles.leaveGameBtn} onClick={handleLeaveGame}>
                            Leave Game
                        </button>
                    </div>
                )
                    :
                    (
                        <div class={styles.Game}>
                            <div>
                                <div class={styles.header} style={{ width: gridWidth() + "px" }}>
                                    <div
                                        class={styles.playerHolder}
                                        style={{
                                            "text-align": "left",
                                            width: (gridWidth() * .325) + "px"
                                        }}
                                    >
                                        <div class={styles.name} style={{ color: playerOne()['color'] }}>{playerOne()['username']}</div>
                                        <div class={styles.score} style={{ color: playerOne()['color'] }}>{playerOneScore()} </div>
                                    </div>
                                    <div
                                        class={styles.timer}
                                        style={{
                                            width: (gridWidth() * .35) + "px"
                                        }}
                                    >
                                        {formattedTime()}
                                    </div>
                                    {
                                        playerTwo() && (
                                            <div
                                                class={styles.playerHolder}
                                                style={{
                                                    "text-align": "right",
                                                    width: (gridWidth() * .325) + "px"
                                                }}
                                            >
                                                <div class={styles.name} style={{ color: playerTwo()['color'] }}>{playerTwo()['username']}</div>
                                                <div class={styles.score} style={{ color: playerTwo()['color'] }}>{playerTwoScore()}</div>
                                            </div>
                                        )
                                    }
                                </div>
                                <div class={styles.grid} style={{ width: gridWidth() + "px" }}>
                                    {currentGrid().map((row, rowIndex) => (
                                        <div class={styles.row} key={rowIndex}>
                                            {row.map((value, colIndex) => {
                                                const pipe = pipes()[rowIndex][colIndex];
                                                const pipeColor = pipe ? pipe.color : dragColor();
                                                const isInCurrentPath = currentPath().some(
                                                    cell => cell.row === rowIndex && cell.col === colIndex
                                                );
                                                return (
                                                    <div
                                                        class={styles.cell}
                                                        style={{ width: cellSize() + "px", height: cellSize() + "px" }}
                                                        key={colIndex}
                                                        onPointerDown={handleStart(rowIndex, colIndex)}
                                                        onPointerMove={handleMove(rowIndex, colIndex)}
                                                        onPointerUp={commitDrag}
                                                    >
                                                        {value !== 0 && (
                                                            <div
                                                                style={{
                                                                    background: cellColorMapping[value],
                                                                    "box-shadow": pipe ? `0 0 10px 5px ${cellColorMapping[value]}` : 'none',
                                                                }}
                                                                class={styles.circle}
                                                            />
                                                        )}
                                                        {(value === 0 && (pipe || isInCurrentPath)) && (
                                                            <svg class={styles.pipe} viewBox="0 0 100 100">
                                                                <path
                                                                    d={getPipePath(
                                                                        pipe && isInCurrentPath
                                                                            ? getPipeConnections(rowIndex, colIndex, currentPath(), pipes)
                                                                            : pipe
                                                                                ? pipe.connections
                                                                                : getPipeConnections(rowIndex, colIndex, currentPath(), pipes)
                                                                    )}
                                                                    stroke={pipeColor}
                                                                    stroke-width="24"
                                                                    fill="none"
                                                                    opacity={isInCurrentPath && !pipe ? 0.5 : 1}
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
            }
        </>
    );
}

export default Game;
