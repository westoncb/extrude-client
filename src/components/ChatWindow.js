import React, {useState} from 'react'
import './ChatWindow.css'
import {InputGroup} from '@blueprintjs/core'

function ChatWindow({sendChatMessage, messages, hideChat}) {
    const [inputText, setInputText] = useState("")

    const handleKeyDown = e => {
        if (e.which === 13) { //check for 'enter' press
            sendChatMessage(inputText)
            setInputText("")
        } else if (e.which === 27) { //escape key
            hideChat()
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
                onKeyDown={handleKeyDown}
                value={inputText}
                onChange={event => setInputText(event.target.value)}
                autoFocus
            />
        </div>
    )
}

export default ChatWindow