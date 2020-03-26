import React, {useState} from 'react';
import MainCanvas from './MainCanvas'
import LoginPrompt from './components/LoginPrompt'
import './App.css';

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState(null)

  const doLogin = (player) => {
        setPlayer(player)
        setLoggedIn(true)
  }

  return (
    <div className="App bp3-dark">

        <MainCanvas/>

        <div className="overlay">
              {!loggedIn &&
                  <LoginPrompt login={doLogin} />
              }
        </div>
    </div>
  );
}

export default App;
