class MeshEvents {
    static MOUSE_MOVE = 'mouse_move'
    static CLICK = 'click'
    static eventMaps = {}

    static listenFor(id, eventsToHandlers) {

        MeshEvents.eventMaps[id] = eventsToHandlers
    }

    static mouseMove(event) {
        Object.values(MeshEvents.eventMaps).forEach(handlerMap => handlerMap['mouse_move'] ? handlerMap['mouse_move'](event) : null)
    }

    static click(event) {
        Object.values(MeshEvents.eventMaps).forEach(handlerMap => handlerMap['click'] ? handlerMap['click'](event) : null)
    }
}

export default MeshEvents