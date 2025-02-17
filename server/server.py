from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import random

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('join_lobby')
def handle_join_lobby():
    n = 5
    grid = [[random.randint(1, 12) for _ in range(n)] for _ in range(n)]
    emit('board_update', grid)

if __name__ == '__main__':
    socketio.run(app)
