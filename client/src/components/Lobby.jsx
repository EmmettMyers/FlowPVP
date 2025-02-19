import { createSignal, onMount } from "solid-js";
import styles from "../styles/Lobby.module.css";
import { useNavigate, useParams } from "@solidjs/router";
import Header from "./Header";
import { generateUserID, setUsername, setLobbyBoardSize, setLobbyGameTime, joinLobby, socket, getLobbyInfo, leaveLobby, startGame } from "../utils/websocket";
import { useGlobalData } from "../Context";

function Lobby() {
    const navigate = useNavigate();
    const { userID, setUserID, lobby, setLobby } = useGlobalData();
    const { lobbyId } = useParams();
    const [users, setUsers] = createSignal([]);
    const [username, setUsernameInput] = createSignal('');
    const [gameTime, setGameTime] = createSignal(30);
    const [boardSize, setBoardSize] = createSignal(5);
    const [isSaved, setIsSaved] = createSignal(true);
    const [gameLoading, setGameLoading] = createSignal(false);

    const gameTimeOptions = [
        { label: "30s", value: 30 },
        { label: "1m", value: 60 },
        { label: "2m", value: 120 },
        { label: "4m", value: 240 }
    ];

    const boardSizeOptions = [
        { label: "5x5", value: 5 },
        { label: "6x6", value: 6 },
        { label: "7x7", value: 7 },
        { label: "8x8", value: 8 }
    ];

    onMount(() => {
        if (!userID()) {
            navigate('/');
        } else {
            getLobbyInfo(lobbyId);
        }

        socket.on('lobby_info', (data) => {
            setUsers(data.players);
            setBoardSize(data.board_size);
            setGameTime(data.game_time);
            const currentUser = data.players[userID()];
            if (currentUser) {
                setUsernameInput(currentUser.username);
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

        if (user && !isNaN(time) && !isNaN(size)) {
            setUsername(lobbyId, userID(), user);
            setLobbyBoardSize(lobbyId, size);
            setLobbyGameTime(lobbyId, time);
            setIsSaved(true);
        }
    };

    const handleStartGame = () => {
        setGameLoading(true);
        startGame(lobbyId, boardSize(), gameTime());
    };

    const handleExitGame = () => {
        leaveLobby(lobbyId, userID());
        navigate('/');
    };

    socket.on('game_started', (data) => {
        setGameLoading(false);
        setLobby(data.lobby);
        navigate('/game/' + lobbyId);
    });

    socket.on('username_set', (data) => {
        if (data.lobby_id === lobbyId) {
            if (data.user_id === userID()) {
                setUsernameInput(data.username);
            }
            setUsers(prevUsers => {
                const updatedUsers = { ...prevUsers };
                if (updatedUsers[data.user_id]) {
                    updatedUsers[data.user_id].username = data.username;
                }
                return updatedUsers;
            });
        }
    });

    socket.on('lobby_board_size_set', (data) => {
        if (data.lobby_id === lobbyId) {
            setBoardSize(data.board_size);
        }
    });

    socket.on('lobby_game_time_set', (data) => {
        if (data.lobby_id === lobbyId) {
            setGameTime(data.game_time);
        }
    });

    socket.on('player_left', (data) => {
        setUsers(prevUsers => {
            const updatedUsers = { ...prevUsers };
            delete updatedUsers[data.user_id];
            return updatedUsers;
        });
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

            <label class={styles.lobbyLabel} for="gameTime">Game Time:</label>
            <div class={styles.selectContainer}>
                {gameTimeOptions.map(option => (
                    <button
                        class={`${styles.selectBtn} ${gameTime() === option.value ? styles.active : ''}`}
                        onClick={() => { setGameTime(option.value); handleInputChange(); }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <label class={styles.lobbyLabel} for="boardSize">Board Size:</label>
            <div class={styles.selectContainer}>
                {boardSizeOptions.map(option => (
                    <button
                        class={`${styles.selectBtn} ${boardSize() === option.value ? styles.active : ''}`}
                        onClick={() => { setBoardSize(option.value); handleInputChange(); }}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            <div class={styles.btnHolder}>
                <button class={styles.lobbySaveBtn} onClick={handleSave} disabled={gameLoading() || isSaved()}>
                    Save
                </button>
                <button class={styles.lobbyStartBtn} onClick={handleStartGame} disabled={gameLoading() || !isSaved()}>
                    {gameLoading() ? <span class={styles.spinner}></span> : "Start"}
                </button>
                <button class={styles.lobbyExitBtn} onClick={handleExitGame} disabled={gameLoading()}>
                    Exit
                </button>
            </div>
        </div>
    );
}

export default Lobby;
