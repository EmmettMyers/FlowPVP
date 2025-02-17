import { createSignal, onCleanup } from 'solid-js';
import styles from '../styles/Game.module.css';

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

    // Helper function to calculate pipe connections
    const getPipeConnections = (row, col, path) => {
        const connections = { top: false, right: false, bottom: false, left: false };
        const index = path.findIndex(cell => cell.row === row && cell.col === col);

        // Handles case when unfinished pipe is started again
        if (index === 0 && pipes()[row][col] !== null) {
            const color = pipes()[row][col]?.color;
            if (row > 0 && pipes()[row - 1][col]?.color === color) connections.top = true;
            if (row < pipes().length - 1 && pipes()[row + 1][col]?.color === color) connections.bottom = true;
            if (col > 0 && pipes()[row][col - 1]?.color === color) connections.left = true;
            if (col < pipes()[row].length - 1 && pipes()[row][col + 1]?.color === color) connections.right = true;
        }

        if (index > 0) {
            const prev = path[index - 1];
            if (prev.row === row - 1) connections.top = true;
            if (prev.row === row + 1) connections.bottom = true;
            if (prev.col === col - 1) connections.left = true;
            if (prev.col === col + 1) connections.right = true;
        }

        if (index < path.length - 1) {
            const next = path[index + 1];
            if (next.row === row - 1) connections.top = true;
            if (next.row === row + 1) connections.bottom = true;
            if (next.col === col - 1) connections.left = true;
            if (next.col === col + 1) connections.right = true;
        }

        return connections;
    };

    // Helper function to generate SVG path for pipes
    const getPipePath = (connections) => {
        const { top, right, bottom, left } = connections;
        const paths = [];

        if (top && bottom) paths.push('M50,0 L50,100');
        else if (left && right) paths.push('M0,50 L100,50');
        else if (top && right) paths.push('M50,0 L50,50 L100,50');
        else if (right && bottom) paths.push('M100,50 L50,50 L50,100');
        else if (bottom && left) paths.push('M50,100 L50,50 L0,50');
        else if (left && top) paths.push('M0,50 L50,50 L50,0');
        else if (top) paths.push('M50,0 L50,50');
        else if (right) paths.push('M50,50 L100,50');
        else if (bottom) paths.push('M50,50 L50,100');
        else if (left) paths.push('M0,50 L50,50');

        return paths.join(' ');
    };

    // Function to find connected cells recursively
    const findConnectedCells = (r, c, color, path, pipes, setPipes, n) => {
        if (r < 0 || r >= n || c < 0 || c >= n || pipes()[r][c]?.color !== color) return;

        path.push({ row: r, col: c });

        // Create a new copy of pipes to avoid mutating the signal directly
        const newPipes = pipes().map(row => row.slice());
        newPipes[r][c] = null; // mark the cell as cleared
        setPipes(newPipes); // update pipes signal

        if (r > 0) findConnectedCells(r - 1, c, color, path, pipes, setPipes, n); // top
        if (r < n - 1) findConnectedCells(r + 1, c, color, path, pipes, setPipes, n); // bottom
        if (c > 0) findConnectedCells(r, c - 1, color, path, pipes, setPipes, n); // left
        if (c < n - 1) findConnectedCells(r, c + 1, color, path, pipes, setPipes, n); // right
    };

    // Function to check if a cell is an edge pipe (only has one connected pipe in all 4 sides)
    const isEdgePipe = (row, col) => {
        let connectedCount = 0;

        // Check the four possible neighboring cells
        if (row > 0 && pipes()[row - 1][col] !== null) connectedCount++; // top
        if (row < pipes().length - 1 && pipes()[row + 1][col] !== null) connectedCount++; // bottom
        if (col > 0 && pipes()[row][col - 1] !== null) connectedCount++; // left
        if (col < pipes().length - 1 && pipes()[row][col + 1] !== null) connectedCount++; // right

        // Return true if exactly one neighbor is connected
        return connectedCount <= 1;
    };


    // Handle mouse down on a cell
    const handleMouseDown = (row, col) => (e) => {
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
            } else if (isEdgePipe(row, col)) {
                const path = [];
                const color = cellPipe.color;
                findConnectedCells(row, col, color, path, pipes, setPipes, n);
                setCurrentPath(path.reverse());
            }
        }
    };


    // Handle mouse enter on a cell
    const handleMouseEnter = (row, col) => (e) => {
        if (!dragging()) return;

        const path = currentPath();

        if (path.length === 0) return;
        
        const lastCell = path[path.length - 1];

        const inCurrentPath = path.slice(0, -1).some(cell => cell.row === row && cell.col === col);
        if (inCurrentPath) {
            setCurrentPath(path.slice(0, -1));
            return;
        }

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

    // Commit the drag and update the pipes
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
            const connections = getPipeConnections(row, col, path);
            newPipes[row][col] = { color, connections };
        }

        setPipes(newPipes);
        cancelDrag();

        checkIfGameWon();
    };

    // Cancel the drag operation
    const cancelDrag = () => {
        setDragging(false);
        setDragColor(null);
        setCurrentPath([]);
    };

    // Remove pipes at a specific cell
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

    const checkIfGameWon = () => {
        const allFilled = grid().every((row, rowIndex) =>
            row.every((cellValue, colIndex) => {
                const pipe = pipes()[rowIndex][colIndex];
                return cellValue !== 0 || pipe !== null; // Check if the cell has either a circle or a pipe
            })
        );
        if (allFilled) {
            console.log('You won the game!');
        }
    };


    // Add event listener for mouse up
    onCleanup(() => {
        window.removeEventListener('mouseup', commitDrag);
    });

    window.addEventListener('mouseup', commitDrag);

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
                                    onMouseDown={handleMouseDown(rowIndex, colIndex)}
                                    onMouseEnter={handleMouseEnter(rowIndex, colIndex)}
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
                                                        ? getPipeConnections(rowIndex, colIndex, currentPath())
                                                        : pipe
                                                            ? pipe.connections
                                                            : getPipeConnections(rowIndex, colIndex, currentPath())
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
