from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import random
from puzzles.gen import generate_puzzle

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join_lobby')
def handle_join_lobby():
    grid = generate_puzzle(width=6, height=6, n=1)
    emit('board_update', grid)

if __name__ == '__main__':
    socketio.run(app)
