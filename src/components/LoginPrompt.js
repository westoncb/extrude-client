import React, {useState} from 'react';
import './LoginPrompt.css'
import {FormGroup, InputGroup, Button} from '@blueprintjs/core'
import Player from '../Player'

function LoginPrompt({logIn}) {
    const [name, setName] = useState("")

    const handleTextChange = e => {
        const text = e.target.value || ""
        setName(text)
    }

    return (
        <div className="login-container bp3-light">
            <FormGroup
                label="Choose a name to use:"
            >
                <InputGroup placeholder="name..." large onChange={handleTextChange}/>
            </FormGroup>

            <Button onClick={() => {
                logIn(Player.create(name))
            }}>Join</Button>
        </div>
    )
}

export default LoginPrompt