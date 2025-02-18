import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";

import './styles/index.css';
import Home from './components/Home';
import Game from './components/Game';
import { testGrids } from './utils/gameUtils';

render(() => (
  <Router>
    <Route path="/" component={Home} />
    <Route path="/game" component={() => <Game inputGrids={testGrids}/>} />
  </Router>
), document.getElementById("root"));
