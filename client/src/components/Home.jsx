import { createSignal, onMount } from "solid-js";
import styles from "../styles/Home.module.css";
import image from "../assets/image.png";
import { useNavigate } from "@solidjs/router";
import { createLobby, generateUserID, joinLobby, socket } from "../utils/websocket";

function Home() {
    const navigate = useNavigate();
    const [userID, setUserID] = createSignal("");
    const [lobbyID, setLobbyID] = createSignal("");

    const handleCreateGame = () => {
        console.log("Creating game...");
        createLobby();
    };

    const handleJoinGame = () => {
        console.log(`Joining game with code: ${lobbyID()}`);
        joinLobby(lobbyID(), userID());
    };

    socket.on('lobby_created', (data) => {
        console.log(`Lobby Created: ${data.lobby_id}`);
        joinLobby(data.lobby_id, userID());
    });

    socket.on('player_joined', (data) => {
        console.log(`${data.user_id} joined lobby ${data.lobby_id}`);
        if (data.user_id === userID()) {
            navigate("/game");
        }
    });

    onMount(() => {
        generateUserID();

        socket.on('user_id_generated', (data) => {
            console.log(`Generated User ID: ${data.user_id}`);
            setUserID(data.user_id);
        });
    });

    return (
        <div class={styles.Home}>
            <img src={image} alt="FlowPVP Image" class={styles.image} />
            <div class={styles.title}>
                <span style={{ color: "white" }}>Flow</span>
                <span style={{ color: "red" }}>P</span>
                <span style={{ color: "orange" }}>V</span>
                <span style={{ color: "yellow" }}>P</span>
            </div>
            <div class={styles.description}>
                Match the colors, connect<br />the pipes and fill the grid!
            </div>
            <div>
                <button
                    class={styles.createBtn}
                    onClick={handleCreateGame}
                >
                    Create Game
                </button>
            </div>
            <div class={styles.or}>or</div>
            <div>
                <input
                    class={styles.input}
                    type="text"
                    value={lobbyID().toLocaleUpperCase()}
                    onInput={(e) => setLobbyID(e.target.value)}
                    maxLength={6}
                    placeholder="Enter Lobby ID"
                    disabled={!userID()}
                />
                <button
                    class={styles.joinBtn}
                    onClick={handleJoinGame}
                    disabled={!userID() || lobbyID().length !== 6}
                >
                    Join Game
                </button>
            </div>
        </div>
    );
}

export default Home;
