import React, {useState} from 'react';
import './LoginPrompt.css'
import {FormGroup, InputGroup, Button} from '@blueprintjs/core'
import Util from '../Util'
import { Vector3 } from 'three';

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
                logIn({ name, id: Math.random(), position: new Vector3(Util.rand(-250, 250), 0, Util.rand(-250, 250))})
            }}>Join</Button>
        </div>
    )
}

export default LoginPrompt