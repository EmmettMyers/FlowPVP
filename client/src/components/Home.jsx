import { createSignal } from "solid-js";
import styles from "../styles/Home.module.css";
import image from "../assets/image.png";
import { useNavigate } from "@solidjs/router";
import { createLobby, socket } from "../utils/websocket";

function Home() {
    const navigate = useNavigate();
    const [lobbyID, setLobbyID] = createSignal("");

    const handleCreateGame = () => {
        console.log("Creating game...");
        createLobby();
    };

    socket.on('lobby_created', (data) => {
        console.log(`Lobby Created: ${data.lobby_id}`);
        navigate("/game");
    });

    const handleJoinGame = () => {
        console.log(`Joining game with code: ${lobbyID()}`);
    };

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
                Match the colors, connect<br/>the pipes and fill the grid!
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
                />
                <button 
                    class={styles.joinBtn} 
                    onClick={handleJoinGame} 
                    disabled={lobbyID().length !== 6}
                >
                    Join Game
                </button>
            </div>
        </div>
    );
}

export default Home;
