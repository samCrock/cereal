exports.log = (entry1, entry2) => {
    if (entry2) {
    	console.log(entry1, entry2)
    } else {
    	console.log(entry1)
    }
}

// frontend use:
// const console = require('electron').remote.require('./logger')
