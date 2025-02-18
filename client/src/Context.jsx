import { createContext, useContext, createSignal } from "solid-js";

const Context = createContext();

export function ContextProvider(props) {
  const [userID, setUserID] = createSignal("");

  return (
    <Context.Provider value={{ userID, setUserID }}>
      {props.children}
    </Context.Provider>
  );
}

export function useUser() {
  return useContext(Context);
}
