import { render } from 'solid-js/web';
import { Router, Route } from "@solidjs/router";

import './styles/index.css';
import Home from './components/Home';
import Game from './components/Game';
import Lobby from './components/Lobby';
import { ContextProvider } from './Context';

render(() => (
  <ContextProvider>
    <Router>
      <Route path="/" component={Home} />
      <Route path="/game/:lobbyId" component={Game} />
      <Route path="/lobby/:lobbyId" component={Lobby} />
    </Router>
  </ContextProvider>
), document.getElementById("root"));
