import React from 'react';
import './LoginPrompt.css'
import {FormGroup, InputGroup, Button} from '@blueprintjs/core'

function LoginPrompt() {

    return (
        <div className="login-container bp3-light">
            <FormGroup
                label="Choose a name to use:"
            >
                <InputGroup placeholder="name..."/>
            </FormGroup>

            <Button>Join</Button>
        </div>
    )
}

export default LoginPrompt