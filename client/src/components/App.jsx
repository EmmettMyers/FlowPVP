import styles from '../styles/App.module.css';
import Game from './Game';

function App() {
  const grids = [
    [
      [1, 2, 0, 3, 0],
      [0, 4, 0, 2, 0],
      [0, 0, 0, 4, 0],
      [1, 0, 0, 0, 0],
      [3, 0, 5, 0, 5]
    ],
    [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 3, 0],
      [1, 0, 1, 0, 0],
      [2, 0, 0, 0, 0],
      [0, 0, 0, 2, 3]
    ],
  ];

  /*
    [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 4, 0],
      [1, 0, 3, 0, 0, 0],
      [2, 0, 0, 4, 0, 0],
      [0, 0, 2, 0, 0, 0],
      [3, 0, 0, 0, 1, 0]
    ],
  */

  return (
    <div class={styles.App}>
      <Game inputGrids={grids} />
    </div>
  );
}

export default App;
