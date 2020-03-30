import React, {useState} from 'react'
import './ChatWindow.css'
import {InputGroup} from '@blueprintjs/core'

function ChatWindow({sendChatMessage, messages}) {
    const [inputText, setInputText] = useState("")

    const sendMessage = e => {
        if (e.which === 13) { //check for 'enter' press
            sendChatMessage(inputText)
            setInputText("")
        }
    }

    return (
        <div className="ChatWindow">
            <div className="all-messages">
                {messages.map(message => (
                    <div className="chat-message" key={message.time}>
                        <div className="chat-message-name">{message.player.name}:</div>
                        <div className="chat-message-content">{message.message}</div>
                    </div>
                ))}
            </div>
            <InputGroup
                className="your-message"
                placeholder="your message..."
                large
                onKeyDown={sendMessage}
                value={inputText}
                onChange={event => setInputText(event.target.value)}
            />
        </div>
    )
}

export default ChatWindow