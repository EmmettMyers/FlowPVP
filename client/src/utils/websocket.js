import { io } from "socket.io-client";

export const socket = io('https://flowpvp.onrender.com');

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

export function alertGameStarted(lobbyId, userId) {
    socket.emit('game_started_alert', { user_id: userId, lobby_id: lobbyId });
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
