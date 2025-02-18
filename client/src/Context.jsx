import { createContext, useContext, createSignal } from "solid-js";

const Context = createContext();

export function ContextProvider(props) {
  const [userID, setUserID] = createSignal("");
  const [lobby, setLobby] = createSignal({});

  return (
    <Context.Provider value={{ userID, setUserID, lobby, setLobby }}>
      {props.children}
    </Context.Provider>
  );
}

export function useGlobalData() {
  return useContext(Context);
}
