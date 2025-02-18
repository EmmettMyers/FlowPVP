import time
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from puzzles.gen import generate_puzzle
import uuid

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

lobbies = {} # {lobby_id: {'players': [user_id], 'boards': [board], 'playerScores': {user_id: score}}}

@socketio.on('create_lobby')
def handle_create_lobby(data):
    board_size = data.get('board_size')
    game_time = data.get('game_time')
    generations = game_time / 30 * 40
    lobby_id = str(uuid.uuid4())[:6]
    boards = generate_puzzle(width=board_size, height=board_size, gens=generations)
    lobbies[lobby_id] = {'players': [], 'boards': boards, 'playerScores': {}}
    emit('lobby_created', {'lobby_id': lobby_id, 'boards': boards})

@socketio.on('join_lobby')
def handle_join_lobby(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies:
        join_room(lobby_id)
        lobbies[lobby_id]['players'].append(user_id)
        lobbies[lobby_id]['playerScores'][user_id] = 0
        emit('player_joined', {'user_id': user_id, 'lobby_id': lobby_id}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby not found'})

@socketio.on('leave_lobby')
def handle_leave_lobby(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies and user_id in lobbies[lobby_id]['players']:
        leave_room(lobby_id)
        lobbies[lobby_id]['players'].remove(user_id)
        del lobbies[lobby_id]['playerScores'][user_id]
        emit('player_left', {'user_id': user_id, 'lobby_id': lobby_id}, room=lobby_id)
        if not lobbies[lobby_id]['players']:
            del lobbies[lobby_id]
    else:
        emit('error', {'message': 'Lobby or user not found'})

@socketio.on('increment_score')
def handle_increment_score(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies and user_id in lobbies[lobby_id]['playerScores']:
        lobbies[lobby_id]['playerScores'][user_id] += 1
        emit('score_updated', {'user_id': user_id, 'score': lobbies[lobby_id]['playerScores'][user_id]}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby or user not found'})

@socketio.on('increment_score')
def start_game(lobby_id, game_time):
    emit('game_started', {'message': 'The game has started!'}, room=lobby_id)
    time.sleep(game_time)
    end_game(lobby_id)

def end_game(lobby_id):
    if lobby_id in lobbies:
        final_scores = lobbies[lobby_id]['playerScores']
        emit('game_over', {'final_scores': final_scores}, room=lobby_id)
        emit('game_ended', {'message': 'The game has ended!'}, room=lobby_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
