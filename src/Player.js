class Player {
    id
    name

    constructor(name) {
        this.id = Math.round(Math.random() * 1e10)
        this.name = name
    }
}

export default Player