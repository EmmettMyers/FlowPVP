import styles from "../styles/Header.module.css";
import image from "../assets/image.png";

function Header({ showImage = false }) {
    return (
        <div class={styles.Header}>
            {
                showImage && <img src={image} alt="FlowPVP Image" class={styles.image} />
            }
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
