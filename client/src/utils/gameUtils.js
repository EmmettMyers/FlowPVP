export const cellColorMapping = {
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

export function convertBoardToGrid(board) {
    return board.map(row => 
        row.map(item => {
            let num = parseInt(item, 10);
            return isNaN(num) ? 0 : num;
        })
    );
}

export const getPipeConnections = (row, col, path, pipes) => {
    const connections = { top: false, right: false, bottom: false, left: false };
    const index = path.findIndex(cell => cell.row === row && cell.col === col);

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

export const getPipePath = (connections) => {
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

export const isGameCompleted = (grid, pipes) => {
    const gridFilled = grid.every((row, rowIndex) =>
        row.every((cellValue, colIndex) => {
            const pipe = pipes[rowIndex][colIndex];
            return cellValue !== 0 || pipe;
        })
    );
    const pipesConnected = grid.every((row, rowIndex) =>
        row.every((cellValue, colIndex) => {
            if (cellValue === 0) return true;
            const pipe = pipes[rowIndex][colIndex];
            if (!pipe) return false;

            const color = cellColorMapping[cellValue];
            return (
                (rowIndex > 0 && pipes[rowIndex - 1][colIndex]?.color === color) ||
                (rowIndex < grid.length - 1 && pipes[rowIndex + 1][colIndex]?.color === color) ||
                (colIndex > 0 && pipes[rowIndex][colIndex - 1]?.color === color) ||
                (colIndex < grid[rowIndex].length - 1 && pipes[rowIndex][colIndex + 1]?.color === color)
            );
        })
    );
    return gridFilled && pipesConnected;
};

export const findConnectedCells = (r, c, color, path, pipes, setPipes, n) => {
    if (r < 0 || r >= n || c < 0 || c >= n || pipes()[r][c]?.color !== color) return;

    const nextSteps = Object.keys(pipes()[r][c]?.connections || {}).filter(
        connection => pipes()[r][c].connections[connection]
    );

    path.push({ row: r, col: c });

    const newPipes = pipes().map(row => row.slice());
    newPipes[r][c] = null;
    setPipes(newPipes);

    nextSteps.forEach(step => {
        switch (step) {
            case 'top':
                findConnectedCells(r - 1, c, color, path, pipes, setPipes, n);
                break;
            case 'right':
                findConnectedCells(r, c + 1, color, path, pipes, setPipes, n);
                break;
            case 'bottom':
                findConnectedCells(r + 1, c, color, path, pipes, setPipes, n);
                break;
            case 'left':
                findConnectedCells(r, c - 1, color, path, pipes, setPipes, n);
                break;
            default:
                break;
        }
    });
};

export const isEdgePipe = (row, col, pipes) => {
    let connectedCount = 0;
    const color = pipes()[row][col]?.color;

    if (row > 0 && pipes()[row - 1][col]?.color === color && pipes()[row - 1][col]?.connections.bottom)
        connectedCount++;
    if (row < pipes().length - 1 && pipes()[row + 1][col]?.color === color && pipes()[row + 1][col]?.connections.top)
        connectedCount++;
    if (col > 0 && pipes()[row][col - 1]?.color === color && pipes()[row][col - 1]?.connections.right)
        connectedCount++;
    if (col < pipes()[row].length - 1 && pipes()[row][col + 1]?.color === color && pipes()[row][col + 1]?.connections.left)
        connectedCount++;

    return connectedCount <= 1;
};

export const testGrids = [
    [
        [1, 2, 0, 3, 0],
        [0, 4, 0, 2, 0],
        [0, 0, 0, 4, 0],
        [1, 0, 0, 0, 0],
        [3, 0, 5, 0, 5]
    ],
    [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0],
        [1, 0, 3, 0, 0, 0],
        [2, 0, 0, 4, 0, 0],
        [0, 0, 2, 0, 0, 0],
        [3, 0, 0, 0, 1, 0]
    ],
    [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 3, 0],
        [1, 0, 1, 0, 0],
        [2, 0, 0, 0, 0],
        [0, 0, 0, 2, 3]
    ],
];
