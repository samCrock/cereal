'use strict'

let WebTorrent = require('webtorrent')
const wt_client = new WebTorrent()

exports = module.exports = function() {

	let wt_module = {}
   
    wt_module['client'] = function client() {
        return wt_client
    }

    return wt_module
}

exports['@singleton'] = true;

