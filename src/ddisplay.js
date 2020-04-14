import {Vector3} from 'three'

class DDisplay {
    static show(name, val) {
        if (!DDisplay.showing) {
            const mainContainer = document.createElement("div")
            mainContainer.classList.add("ddisplay")
            document.getElementsByClassName("App")[0].appendChild(mainContainer)

            DDisplay.map = {}
            DDisplay.showing = true
        }

        if (DDisplay.map[name] === undefined) {
            const nameElement = document.createElement("div")
            nameElement.id = "ddisplay_"+name+"_name"
            nameElement.classList.add("ddisplay_name")
            nameElement.innerText = name + ": "
            const valElement = document.createElement("div")
            valElement.id = "ddisplay_" + name + "_val"
            valElement.classList.add("ddisplay_val")
            valElement.innerText = "test"
            const elementContainer = document.createElement("div")
            elementContainer.classList.add("ddisplay_element_container")
            elementContainer.appendChild(nameElement)
            elementContainer.appendChild(valElement)
            const mainContainer = document.getElementsByClassName("ddisplay")[0]
            mainContainer.appendChild(elementContainer)
        }

        if (!isNaN(val)) {
            DDisplay.map[name] = val.toFixed(4)
        } else if (val instanceof Vector3) {
            DDisplay.map[name] = val.x.toFixed(1) + ", " + val.y.toFixed(1) + ", " + val.z.toFixed(1)
        }

        
        
        Object.keys(DDisplay.map).forEach(key => {
            document.getElementById("ddisplay_" + key + "_val").innerText = DDisplay.map[key]
        })
    }
}

export default DDisplay