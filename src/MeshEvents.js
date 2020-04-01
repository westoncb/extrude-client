class MeshEvents {
    static MOUSE_MOVE = 'mouse_move'
    static CLICK = 'click'
    static eventMaps = []

    static listenFor(eventsToHandlers) {

        // can only handle 1 for now... (easier to override old handlers this way)
        MeshEvents.eventMaps[0] = eventsToHandlers
    }

    static mouseMove(event) {
        MeshEvents.eventMaps.forEach(handlerMap => handlerMap['mouse_move'] ? handlerMap['mouse_move'](event) : null)
    }

    static click(event) {
        MeshEvents.eventMaps.forEach(handlerMap => handlerMap['click'] ? handlerMap['click'](event) : null)
    }
}

export default MeshEvents