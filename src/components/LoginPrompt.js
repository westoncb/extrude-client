import React, {useState} from 'react';
import './LoginPrompt.css'
import {FormGroup, InputGroup, Button} from '@blueprintjs/core'
import Player from '../PlayerData'

function LoginPrompt({logIn}) {
    const [name, setName] = useState("")

    const handleTextChange = e => {
        const text = e.target.value || ""
        setName(text)
    }

    const handleKeyPress = e => e.which === 13 ? logIn(Player.create(name)) : ""

    return (
        <div className="login-container bp3-light">
            <FormGroup
                label="Choose a name to use:"
            >
                <InputGroup autoFocus placeholder="name..." large onChange={handleTextChange} onKeyDown={handleKeyPress}/>
            </FormGroup>

            <Button onClick={() => {
                logIn(Player.create(name))
            }}>Join</Button>
        </div>
    )
}

export default LoginPrompt