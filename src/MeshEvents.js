class MeshEvents {
    static MOUSE_MOVE = 'mouse_move'
    static CLICK = 'click'
    static POINTER_OUT = 'pointer_out'
    static eventMaps = {}

    static listenFor(id, eventsToHandlers, includedMeshes) {

        eventsToHandlers.includedMeshes = includedMeshes
        MeshEvents.eventMaps[id] = eventsToHandlers
    }

    static removeListener(id) {
        delete MeshEvents.eventMaps[id]
    }

    static eventOccurred(type, event) {
        Object.values(MeshEvents.eventMaps).forEach(handlerMap => {
            const meshQualifies = !handlerMap.includedMeshes || handlerMap.includedMeshes.includes(event.object.id)
            if (meshQualifies && handlerMap[type]) {
                 handlerMap[type](event)
            }
        })
    }
}

export default MeshEvents