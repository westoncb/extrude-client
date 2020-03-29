import React, {useState, useEffect} from 'react';
import MainCanvas from './MainCanvas'
import LoginPrompt from './components/LoginPrompt'
import Playground from './Playground'
import Player from './Player'
import './App.css';

const QUICK_START = true

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState(null)
  const [playground, setPlayground] = useState(null)

  const doLogin = (player) => {
        setPlayer(player)
        // setPlayground(new Playground(player))
        setLoggedIn(true)
  }

  useEffect(() => {
      if (QUICK_START)
          doLogin()
  }, [])

  return (
    <div className="App bp3-dark">

        <MainCanvas playground={playground}/>

        <div className="overlay">
              {!loggedIn &&
                  <LoginPrompt logIn={doLogin} />
              }
        </div>
    </div>
  );
}

export default App;
