import React, {useState, useRef, useEffect} from 'react'
import './ChatWindow.css'
import {InputGroup} from '@blueprintjs/core'

function ChatWindow({sendChatMessage, localPlayer, players, messages, hideChat}) {
    const [inputText, setInputText] = useState("")
    const allMessagesRef = useRef()

    const handleKeyDown = e => {
        if (e.which === 13) { //check for 'enter' press
            sendChatMessage({ message: inputText, playerId: localPlayer.id, time: new Date()})
            setInputText("")
        } else if (e.which === 27) { //escape key
            hideChat()
        }

        e.stopPropagation()
    }

    useEffect(() => {
        allMessagesRef.current.scrollTop = allMessagesRef.current.scrollHeight
    }, [messages])

    return (
        <div className="ChatWindow">
            <div className="all-messages" ref={allMessagesRef}>
                {messages.map(message => (
                    <div className="chat-message" key={message.time}>
                        <div className="chat-message-name">{players[message.playerId].name}:</div>
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