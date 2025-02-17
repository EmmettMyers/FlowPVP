import { createSignal, onCleanup, createEffect } from 'solid-js';
import styles from '../styles/Game.module.css';
import { cellColorMapping, isGameCompleted, findConnectedCells, getPipeConnections, getPipePath, isEdgePipe } from '../utils/gameUtils';

function Game({ inputGrids }) {
    const [currentGridIndex, setCurrentGridIndex] = createSignal(0);
    const currentGrid = () => inputGrids[currentGridIndex()];
    const n = () => currentGrid()[0].length;
    const cellSize = () => `${85.0 / n()}vw`;

    const [pipes, setPipes] = createSignal(
        Array(n()).fill().map(() => Array(n()).fill(null))
    );
    const [dragging, setDragging] = createSignal(false);
    const [dragColor, setDragColor] = createSignal(null);
    const [currentPath, setCurrentPath] = createSignal([]);

    const [score, setScore] = createSignal(0);
    const [timeLeft, setTimeLeft] = createSignal(60);

    createEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(t => (t > 0 ? t - 1 : 0));
        }, 1000);
        onCleanup(() => clearInterval(timer));
    });

    createEffect(() => {
        const current = currentGrid();
        const currentPipes = pipes();
        const index = currentGridIndex();
        if (isGameCompleted(current, currentPipes)) {
            setScore(s => s + 1);
            if (index < inputGrids.length - 1) {
                setCurrentGridIndex(index + 1);
                setPipes(Array(n()).fill().map(() => Array(n()).fill(null)));
                cancelDrag();
            } else {
                console.log("All grids completed!");
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

    onCleanup(() => {
        window.removeEventListener('pointerup', commitDrag, { passive: false });
    });

    window.addEventListener('pointerup', commitDrag, { passive: false });

    return (
        <div class={styles.Game}>
            <div>
                <div class={styles.header}>
                    <div class={styles.score}>Solved: {score()}</div>
                    <div class={styles.timer}>{formattedTime()}</div>
                </div>
                <div class={styles.grid}>
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
                                        style={{ width: cellSize(), height: cellSize() }}
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
                                                    stroke-width="20"
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
    );
}

export default Game;
