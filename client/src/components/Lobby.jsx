import { createSignal, onMount } from "solid-js";
import styles from "../styles/Lobby.module.css";
import { useNavigate, useParams } from "@solidjs/router";
import Header from "./Header";
import { generateUserID, setUsername, setLobbyBoardSize, setLobbyGameTime, joinLobby, socket, getLobbyInfo } from "../utils/websocket";
import { useUser } from "../Context";

function Lobby() {
    const navigate = useNavigate();
    const { userID, setUserID } = useUser();
    const { lobbyId } = useParams();
    const [users, setUsers] = createSignal([]);
    const [username, setUsernameInput] = createSignal('');
    const [gameTime, setGameTime] = createSignal('');
    const [boardSize, setBoardSize] = createSignal('');
    const [isSaved, setIsSaved] = createSignal(true);

    onMount(() => {
        if (!userID()) {
            generateUserID();
        } else {
            getLobbyInfo(lobbyId);
        }

        socket.on('user_id_generated', (data) => {
            setUserID(data.user_id);
            joinLobby(lobbyId, data.user_id);
        });
        socket.on('player_joined', (data) => {
            if (data.user_id === userID()) {
                getLobbyInfo(data.lobbyId);
            }
        });

        socket.on('lobby_info', (data) => {
            setUsers(data.players);
            setBoardSize(data.board_size);
            setGameTime(data.game_time);
            const currentUser = data.players[userID()];
            if (currentUser) {
                setUsernameInput(currentUser.username);
                setUserColorInput(currentUser.color);
            }
        });
    });

    const handleInputChange = () => {
        setIsSaved(false);
    };

    const handleSave = () => {
        const user = username();
        const time = parseInt(gameTime());
        const size = parseInt(boardSize());

        if (user && color && !isNaN(time) && !isNaN(size)) {
            setUsername(lobbyId, userID(), user);
            setLobbyBoardSize(lobbyId, size);
            setLobbyGameTime(lobbyId, time);
            setIsSaved(true);
        }
    };

    socket.on('username_set', (data) => {
        if (data.lobbyId === lobbyId) {
            console.log(`${data.user_id}'s username set to ${data.username} in lobby ${data.lobby_id}`);
        }
    });

    socket.on('lobby_board_size_set', (data) => {
        if (data.lobbyId === lobbyId) {
            console.log(`Lobby ${data.lobby_id}'s board size set to ${data.board_size}`);
            setBoardSize(data.board_size);
        }
    });

    socket.on('lobby_game_time_set', (data) => {
        if (data.lobbyId === lobbyId) {
            console.log(`Lobby ${data.lobby_id}'s game time set to ${data.game_time} seconds`);
            setGameTime(data.game_time);
        }
    });

    return (
        <div class={styles.Lobby}>
            <Header />

            <div class={styles.idHolder}>
                <div class={styles.lobbyIdLabel}>Lobby ID:</div>
                <div class={styles.lobbyId}>{lobbyId()}</div>
            </div>
            <div class={styles.usersHolder}>
                <div class={styles.usersLabel}>Lobby Users:</div>
                <div class={styles.users}>
                    {users() && Object.values(users()).map(user => (
                        <div key={user.user_id} style={{ color: user.color }}>
                            {user.username}
                        </div>
                    ))}
                </div>
            </div>

            <label class={styles.lobbyLabel} for="username">Username:</label>
            <input
                class={styles.lobbyInput}
                type="text"
                id="username"
                value={username()}
                onInput={(e) => { setUsernameInput(e.target.value); handleInputChange(); }}
            />

            <label class={styles.lobbyLabel} for="gameTime">Game Time (seconds):</label>
            <input
                class={styles.lobbyInput}
                type="number"
                id="gameTime"
                value={gameTime()}
                onInput={(e) => { setGameTime(e.target.value); handleInputChange(); }}
            />

            <label class={styles.lobbyLabel} for="boardSize">Board Size:</label>
            <input
                class={styles.lobbyInput} 
                type="number"
                id="boardSize"
                value={boardSize()}
                onInput={(e) => { setBoardSize(e.target.value); handleInputChange(); }}
            />

            <button class={styles.lobbyBtn} onClick={handleSave} disabled={isSaved()}>
                {isSaved() ? 'Saved' : 'Save'}
            </button>
        </div>
    );
}

export default Lobby;
