import { createSignal, onCleanup } from 'solid-js';
import styles from '../styles/Game.module.css';
import { checkIfGameWon, findConnectedCells, getPipeConnections, getPipePath, isEdgePipe } from '../utils/gameUtils';

function Game() {
    const n = 5;
    const colorMapping = {
        1: 'green',
        2: 'yellow',
        3: 'blue',
        4: 'red',
        5: 'purple',
        6: 'orange',
        7: 'pink',
        8: 'brown',
        9: 'cyan',
        10: 'magenta',
        11: 'lime',
        12: 'teal'
    };

    const [grid, setGrid] = createSignal(
        [
            [1, 2, 0, 3, 0],
            [0, 4, 0, 2, 0],
            [0, 0, 0, 4, 0],
            [1, 0, 0, 0, 0],
            [3, 0, 5, 0, 5]
        ]
    );

    const [pipes, setPipes] = createSignal(
        Array(n).fill().map(() => Array(n).fill(null))
    );
    const [dragging, setDragging] = createSignal(false);
    const [dragColor, setDragColor] = createSignal(null);
    const [currentPath, setCurrentPath] = createSignal([]);

    const handleStart = (row, col) => (e) => {
        const value = grid()[row][col];
        const currentColor = colorMapping[value];
        const cellPipe = pipes()[row][col];

        if (value === 0 && cellPipe === null) return;

        if (cellPipe !== null && cellPipe.color === currentColor) {
            removePipesAt(row, col, currentColor);
        } else {
            setDragging(true);
            setDragColor(currentColor || pipes()[row][col].color);
            if (cellPipe === null) {
                setCurrentPath([{ row, col }]);
            } else if (isEdgePipe(row, col, pipes)) {
                const path = [];
                const color = cellPipe.color;
                findConnectedCells(row, col, color, path, pipes, setPipes, n);
                setCurrentPath(path.reverse());
            }
        }
    };

    const handleMove = (row, col) => (e) => {
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

        if (path.filter(cell => grid()[cell.row][cell.col] !== 0).length >= 2) return;

        const cellValue = grid()[row][col];
        if (cellValue !== 0 && colorMapping[cellValue] !== dragColor()) {
            cancelDrag();
            return;
        }

        const cellPipe = pipes()[row][col];
        if (cellPipe && cellPipe.color !== dragColor()) {
            cancelDrag();
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

        checkIfGameWon(grid, pipes);
    };

    const cancelDrag = () => {
        setDragging(false);
        setDragColor(null);
        setCurrentPath([]);
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
        window.removeEventListener('mouseup', commitDrag);
        window.removeEventListener('touchend', commitDrag);
    });

    window.addEventListener('mouseup', commitDrag);
    window.addEventListener('touchend', commitDrag);

    return (
        <div class={styles.Game}>
            <div class={styles.grid}>
                {grid().map((row, rowIndex) => (
                    <div class={styles.row} key={rowIndex}>
                        {row.map((value, colIndex) => {
                            const pipe = pipes()[rowIndex][colIndex];
                            const isInCurrentPath = currentPath().some(
                                cell => cell.row === rowIndex && cell.col === colIndex
                            );

                            return (
                                <div
                                    class={styles.cell}
                                    key={colIndex}
                                    onMouseDown={handleStart(rowIndex, colIndex)}
                                    onTouchStart={handleStart(rowIndex, colIndex)}
                                    onMouseEnter={handleMove(rowIndex, colIndex)}
                                    onTouchMove={handleMove(rowIndex, colIndex)}
                                    onTouchEnd={commitDrag}
                                >
                                    {value !== 0 && (
                                        <div
                                            style={{
                                                background: colorMapping[value],
                                                "box-shadow": pipe ? `0 0 10px 5px ${colorMapping[value]}` : 'none',
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
                                                stroke={pipe ? pipe.color : dragColor()}
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
    );
}

export default Game;
