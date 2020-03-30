import React, {useState, useEffect} from 'react';
import MainCanvas from './MainCanvas'
import LoginPrompt from './components/LoginPrompt'
import Player from './Player'
import './App.css';

const QUICK_START = false

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState(null)

  const doLogin = (player) => {
        setPlayer(player)
        setLoggedIn(true)
  }

  useEffect(() => {
      if (QUICK_START)
          doLogin(Player.create())
  }, [])

  return (
    <div className="App bp3-dark">

        {player &&
          <MainCanvas player={player}/>
        }

        <div className="screen-container">
              {!loggedIn &&
                  <LoginPrompt logIn={doLogin} />
              }
        </div>
    </div>
  );
}

export default App;
