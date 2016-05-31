'use strict'

let request = require('request')
let cheerio = require('cheerio')
let Promise = require('bluebird')
let fsExtra = require('fs-extra')
let chalk = require('chalk')

let url = 'http://www.pogdesign.co.uk/cat/'
let json

exports = module.exports = function() {

    let json_module = {}

    json_module['updateFollowing'] = function updateFollowing(showObj) {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/following.json', (err, data) => {

                if (err) throw err
                if (data) { // Locals exists

                    let json = JSON.parse(data)
                    json.filter((following, index) => {
                        // console.log('following', following, '===', showObj)
                        if (following.title.toLowerCase() === showObj.title.toLowerCase()) {
                            json = json.splice(index, 1)
                        }
                    })
                    json.push(showObj);
                    fsExtra.writeFile('./backend/json/following.json', JSON.stringify(json, null, 4), function(err) {
                        if (err) reject('Cannot write file :', err)
                        resolve(json)
                    })
                } else {
                    reject('Cannot find following.json')
                }
            })

        })
    }

    json_module['getPoster'] = function getPoster(showName) {
        return new Promise(function(resolve, reject) {
            // console.log('showName', showName)
            fsExtra.readFile('./backend/json/following.json', (err, data) => {
                if (data) { // Locals exists
                    let json = JSON.parse(data)
                    for (var i = json.length - 1; i >= 0; i--) {
                        if (json[i].title.toLowerCase() === showName.toLowerCase()) {
                            resolve(json[i].poster)
                        }
                    }
                }
            })

        })
    }

    json_module['getLocalTorrent'] = function getLocalTorrent(title) {
        return new Promise(function(resolve, reject) {
            // console.log('local title', title)
            fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
                if (data) { // Locals exists
                    let json = JSON.parse(data)
                    json.filter((torrent) => {
                        // console.log('torrent title', torrent.title)
                        if (torrent.title.toLowerCase() === title.toLowerCase()) {
                            // console.log('match:', torrent)
                            resolve(torrent)
                        }
                    })
                    reject()
                }
            })
        })
    }

    json_module['getCompleted'] = function getCompleted() {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
                let completed = []
                if (data) {
                    data = JSON.parse(data)
                    data.filter( (show) => {
                        if (show.ready) {
                            completed.push(show)
                        }
                    })
                    resolve(completed)
                } else reject()
            })
        })
    }

    json_module['updateLibrary'] = function updateLibrary(torrent_object) {
        // return new Promise(function(resolve, reject) {
        fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
            if (err) throw err;
            var json = []
            if (data) { // Locals exists
                json = JSON.parse(data)
                json.filter((jsonObj, i) => {
                    if (jsonObj.title === torrent_object.title) json.splice(i, 1)
                })
                json.push(torrent_object)
                fsExtra.writeFile('./backend/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
                    if (err) reject('Cannot write file :', err)
                        // console.log(torrent_object.title, 'added')
                    return json
                })
            } else { // first entry
                json.push(torrent_object);
                fsExtra.writeFile('./backend/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
                    if (err) reject('Cannot write file :', err)
                    return json
                })
            }
        })

        // })
    }


    json_module['month'] = function month() {
        return new Promise(function(resolve, reject) {
            request(url, function(error, response, html) {
                
                if (!error) {
                    console.log(chalk.blue('Checking calendar'))

                    var $ = cheerio.load(html)
                    var json = []

                    $('.day, .today').filter(function() {
                        var date = this.attribs.id
                        date = date.split('_')
                        var date_d = date[1]
                        var date_m = date[2] - 1
                        var date_y = date[3]
                        var date_obj = new Date(date_y, date_m, date_d)
                        var date_label = date_obj.toDateString()
                        var day = {
                            date: date_obj,
                            date_label: date_label,
                            shows: []
                        }
                        for (var i = this.children.length - 1; i >= 0; i--) {
                            if (this.children[i].name === 'div' && this.children[i].attribs.class.match('ep ')) {
                                var d = this.children[i].children;
                                for (var j = d.length - 1; j >= 0; j--) {
                                    if (d[j].name === 'span') {
                                        var children = d[j].children
                                        for (var k = children.length - 1; k >= 0; k--) {
                                            if (children[k].name === 'p') {
                                                var title = children[k].children[0].children[0].data
                                                var episode = children[k].children[0].next.next.children[0].data
                                                day.shows.push({
                                                    title: title,
                                                    episode: episode
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        json.push(day)
                    })

                    // Write monthly.json with all the info regarding the shows
                    fsExtra.writeFile('./backend/json/monthly.json', JSON.stringify(json, null, 4), function(err) {
                        resolve(json)
                    })
                }
            })
        })
    }
    return json_module
}

exports['@singleton'] = true
