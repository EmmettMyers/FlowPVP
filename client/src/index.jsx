import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";

import './styles/index.css';
import Home from './components/Home';
import Game from './components/Game';
import Lobby from './components/Lobby';
import { testGrids } from './utils/gameUtils';
import { ContextProvider } from './Context';

render(() => (
  <ContextProvider>
    <Router>
      <Route path="/" component={Home} />
      <Route path="/game" component={() => <Game inputGrids={testGrids}/>} />
      <Route path="/lobby/:lobbyId" component={Lobby} />
    </Router>
  </ContextProvider>
), document.getElementById("root"));
