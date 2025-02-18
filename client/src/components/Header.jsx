import styles from "../styles/Header.module.css";
import image from "../assets/image.png";

function Header() {
    return (
        <div class={styles.Header}>
            <img src={image} alt="FlowPVP Image" class={styles.image} />
            <div class={styles.title}>
                <span style={{ color: "white" }}>Flow</span>
                <span style={{ color: "red" }}>P</span>
                <span style={{ color: "orange" }}>V</span>
                <span style={{ color: "yellow" }}>P</span>
            </div>
        </div>
    );
}

export default Header;
