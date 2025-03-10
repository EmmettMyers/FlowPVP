import random
import time
from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from puzzles.gen import generate_puzzle
import uuid

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "https://flow-pvp.web.app"}})
socketio = SocketIO(app, cors_allowed_origins="https://flow-pvp.web.app")

USER_COLORS = ['red', 'dodgerblue', 'green', 'yellow', 'cyan', 'magenta', 'lime', 'orange']

user_ids = set()
lobbies = {}
"""
{lobby_id: 
    {players: 
        {user_id: {username, color, score}
    }, 
    boards: [board], 
    board_size: size, 
    game_time: time
}
"""

@socketio.on('generate_user_id')
def handle_generate_user_id():
    user_id = str(uuid.uuid4())[:6]
    while user_id in user_ids:
        user_id = str(uuid.uuid4())[:6]    
    user_ids.add(user_id)    
    emit('user_id_generated', {'user_id': user_id})

@socketio.on('create_lobby')
def handle_create_lobby():
    lobby_id = str(uuid.uuid4())[:6].upper()
    lobbies[lobby_id] = {
        'players': {},
        'boards': [],
        'board_size': 5,
        'game_time': 60
    }
    emit('lobby_created', {'lobby_id': lobby_id})

@socketio.on('get_lobby_info')
def handle_get_lobby_info(data):
    lobby_id = data.get('lobby_id')
    if lobby_id in lobbies:
        lobby_info = lobbies[lobby_id]
        emit('lobby_info', lobby_info, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby not found'})

@socketio.on('join_lobby')
def handle_join_lobby(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies:
        players = lobbies[lobby_id]['players']
        if len(players) >= 4:
            emit('error', {'user_id': user_id, 'message': 'Lobby is full'})
            return
        join_room(lobby_id)

        existing_colors = {player['color'] for player in players.values()}
        remaining_colors = [color for color in USER_COLORS if color not in existing_colors]
        color = random.choice(remaining_colors)
        
        lobbies[lobby_id]['players'][user_id] = {'username': user_id, 'color': color, 'score': 0}
        emit('player_joined', {'user_id': user_id, 'lobby_id': lobby_id}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby not found'})

@socketio.on('leave_lobby')
def handle_leave_lobby(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies and user_id in lobbies[lobby_id]['players']:
        leave_room(lobby_id)
        del lobbies[lobby_id]['players'][user_id]
        emit('player_left', {'user_id': user_id, 'lobby_id': lobby_id}, room=lobby_id)
        if not lobbies[lobby_id]['players']:
            del lobbies[lobby_id]
    else:
        emit('error', {'message': 'Lobby or user not found'})

@socketio.on('increment_score')
def handle_increment_score(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    if lobby_id in lobbies and user_id in lobbies[lobby_id]['players']:
        lobbies[lobby_id]['players'][user_id]['score'] += 1
        emit('score_updated', {'user_id': user_id, 'score': lobbies[lobby_id]['players'][user_id]['score']}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby or user not found'})

@socketio.on('game_started_alert')
def game_started_alert(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    emit('alert_game_started', {'user_id': user_id}, room=lobby_id)

@socketio.on('start_game')
def start_game(data):
    lobby_id = data.get('lobby_id')
    if lobby_id not in lobbies:
        return
    board_size = lobbies[lobby_id]['board_size']
    game_time = lobbies[lobby_id]['game_time']

    max_generations = {5: 20, 6: 16, 7: 12, 8: 8}
    generations_per_30s = max_generations.get(board_size, 8)
    generations = (game_time // 30) * generations_per_30s  

    boards = generate_puzzle(width=board_size, height=board_size, gens=generations)
    for player in lobbies[lobby_id]['players'].values():
        player['score'] = 0
    lobbies[lobby_id]['boards'] = boards
    emit('game_started', {'lobby': lobbies[lobby_id]}, room=lobby_id)

@socketio.on('set_username')
def handle_set_username(data):
    lobby_id = data.get('lobby_id')
    user_id = data.get('user_id')
    username = data.get('username')
    if lobby_id in lobbies and user_id in lobbies[lobby_id]['players']:
        lobbies[lobby_id]['players'][user_id]['username'] = username
        emit('username_set', {'user_id': user_id, 'username': username, 'lobby_id': lobby_id}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby or user not found'})

@socketio.on('set_lobby_board_size')
def handle_set_lobby_board_size(data):
    lobby_id = data.get('lobby_id')
    board_size = data.get('board_size')
    if lobby_id in lobbies:
        lobbies[lobby_id]['board_size'] = board_size
        emit('lobby_board_size_set', {'lobby_id': lobby_id, 'board_size': board_size}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby not found'})

@socketio.on('set_lobby_game_time')
def handle_set_lobby_game_time(data):
    lobby_id = data.get('lobby_id')
    game_time = data.get('game_time')
    if lobby_id in lobbies:
        lobbies[lobby_id]['game_time'] = game_time
        emit('lobby_game_time_set', {'lobby_id': lobby_id, 'game_time': game_time}, room=lobby_id)
    else:
        emit('error', {'message': 'Lobby not found'})

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000)
