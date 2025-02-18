import { io } from "socket.io-client";

export const socket = io('http://127.0.0.1:5000');

socket.on('player_left', (data) => {
    console.log(`${data.user_id} left lobby ${data.lobby_id}`);
});

socket.on('score_updated', (data) => {
    console.log(`${data.user_id}'s score updated to ${data.score}`);
});

socket.on('game_started', (data) => {
    console.log('Game started with boards:', data.boards);
});

socket.on('game_over', (data) => {
    console.log('Game Over! Final scores:', data.final_scores);
});

socket.on('error', (data) => {
    console.error('Error:', data.message);
});

export function generateUserID() {
    socket.emit('generate_user_id');
}

export function createLobby() {
    socket.emit('create_lobby');
}

export function getLobbyInfo(lobbyId) {
    socket.emit('get_lobby_info', { lobby_id: lobbyId });
}

export function joinLobby(lobbyId, userId) {
    socket.emit('join_lobby', { lobby_id: lobbyId, user_id: userId });
}

export function leaveLobby(lobbyId, userId) {
    socket.emit('leave_lobby', { lobby_id: lobbyId, user_id: userId });
}

export function incrementScore(lobbyId, userId) {
    socket.emit('increment_score', { lobby_id: lobbyId, user_id: userId });
}

export function startGame(lobbyId, boardSize, gameTime) {
    socket.emit('start_game', { lobby_id: lobbyId, board_size: boardSize, game_time: gameTime });
}

export function setUsername(lobbyId, userId, username) {
    socket.emit('set_username', { lobby_id: lobbyId, user_id: userId, username: username });
}

export function setLobbyBoardSize(lobbyId, boardSize) {
    socket.emit('set_lobby_board_size', { lobby_id: lobbyId, board_size: boardSize });
}

export function setLobbyGameTime(lobbyId, gameTime) {
    socket.emit('set_lobby_game_time', { lobby_id: lobbyId, game_time: gameTime });
}
