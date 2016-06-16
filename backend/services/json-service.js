'use strict'

let request = require('request')
let cheerio = require('cheerio')
let Promise = require('bluebird')
let fsExtra = require('fs-extra')

let url = 'http://www.pogdesign.co.uk/cat/'
let json

exports = module.exports = function(commonService) {

    let json_module = {}

    json_module['getFollowing'] = function getFollowing() {
        return new Promise((resolve, reject) => {
            let following = []
            fsExtra.readFile('./backend/json/following.json', (err, data) => {
                if (data) {
                    data = JSON.parse(data)
                    data.filter( (show) => {
                        if (!show.poster) {

                        }
                        following.push(show)
                    })
                    resolve(following)
                }
            })
        })
    }

    // Used to add poster location after download
    json_module['updateFollowing'] = function updateFollowing(showObj) {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/following.json', (err, data) => {

                if (err) throw err
                if (data) { // Locals exists

                    let json = JSON.parse(data)
                    json.filter((following, index) => {
                            // console.log('following', following, '===', showObj)
                            if (following.title.toLowerCase() === showObj.title.toLowerCase()) {
                                following.poster = showObj.poster
                            }
                        })
                        // json.push(showObj);
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

    // Returns poster path given the show name
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

    // Returns torrent object given the show title
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

    // Returns all completed shows from local_torrents
    json_module['getCompleted'] = function getCompleted() {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
                let completed = []
                if (data) {
                    data = JSON.parse(data)
                    data.filter((show) => {
                        if (show.ready) {
                            completed.push(show)
                        }
                    })
                    resolve(completed)
                } else reject()
            })
        })
    }

    // Updates local_torrents given a torrent object
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

    // Returns additional episode info (date + ep title) given a torrent objecct
    json_module['getEpisodeInfo'] = function getEpisodeInfo(t) {
        return new Promise(function(resolve, reject) {
            let dashedShowName = t.show.toLowerCase().replace(' ', '-')
            dashedShowName = dashedShowName.replace(' ', '-')
            dashedShowName = dashedShowName.replace(' ', '-')
            let tSeason = t.episode.substr(1, 2)
            let tEpisode = t.episode.substr(4, 5)
            fsExtra.readFile('./backend/json/episodes/' + dashedShowName + '.json', (err, data) => {
                if (err) throw err;
                if (data) {
                    let episodes = JSON.parse(data)
                    episodes.filter( (ep) => {
                        if (ep.season === tSeason && ep.episode === tEpisode) {
                            console.log('Title ->', ep.title, ep.date)
                            t.date_label = ep.date
                            t.date = new Date(ep.date)
                            t.episode_title = ep.title
                            resolve(t)
                        }

                    })
                }
            })

        })
    }

    // Writes month.json and returns current month's shows calendar
    json_module['month'] = function month() {
        return new Promise(function(resolve, reject) {
            request(url, function(error, response, html) {

                if (!error) {
                    console.log('Checking calendar')

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

    // Writes and returns target show episode list (category is used internally to catch TV specific show names)
    let getEpisodes = json_module['getEpisodes'] = function getEpisodes(show, category) {
        return new Promise(function(resolve, reject) {

            show = show.toLowerCase()

            console.log('Searching Kickass for: ' + show)
            console.log()

            let episodes = []

            let searchString = encodeURIComponent(show)

            let url = 'https://kickass.unblocked.tv/usearch/' + searchString
            if (category) url += 'category:tv/'

            request.get({ url: url }, function(error, response, body) {

                if (error || !response) return reject(error)

                console.log('Status', response.statusCode);

                if (!error && response.statusCode == 200) {

                    let $ = cheerio.load(body)

                    let show_title = $('h1')['0']
                    let show_url
                    if (show_title) show_url = 'https://kickass.unblocked.tv' + $('h1')['0'].children[0].attribs.href
                    if (!show_title) return getEpisodes(show, true)
                    console.log('show_url', show_url)

                    request.get(show_url, function(error, response, body) {
                        if (error || !response) return reject(error)
                            // console.log(response.statusCode)
                            // console.log('-', show, 'episodes -')
                        if (!error && response.statusCode == 200) {
                            let $ = cheerio.load(body)
                            $('.infoList').filter((label, ep) => {
                                let season = ep.parent.parent.prev.prev.children[0].data
                                season = season.split(/Season /)
                                season = season[1]
                                let episode = ep.children[1].children[1].children[0].data
                                episode = episode.split(/Episode /)
                                episode = episode[1]
                                episode = episode.split(/\t/)
                                episode = episode[0]
                                let title = ep.children[1].children[3].children[0].data
                                let date_label = ep.children[1].children[5].children[1].children[0].data
                                    // console.log('   Season', season, 'Episode', episode)
                                    // console.log('       Title      :', title)
                                    // console.log('       Date       :', date_label)
                                episodes.push({
                                    season: season,
                                    episode: episode,
                                    title: title,
                                    date: date_label
                                })
                            })

                            let dashedShowName = show.replace(' ', '-')
                            dashedShowName = dashedShowName.replace(' ', '-')
                            dashedShowName = dashedShowName.replace(' ', '-')

                            fsExtra.writeFile('./backend/json/episodes/' + dashedShowName + '.json', JSON.stringify(episodes, null, 4), function(err) {
                                if (err) reject('Cannot write file :', err)
                                resolve(episodes)
                            })
                        }
                    })
                }

                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body);

                } else resolve(404)
            })
        })
    }

    // Get all shows from following.json and populates epipsode dir wi/ episodes list
    json_module['updateFollowingEpisodes'] = function updateFollowingEpisodes() {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/following.json', (err, data) => {

                if (err) throw err
                if (data) { // Locals exists

                    let json = JSON.parse(data)
                    let showEpisode = []
                    json.filter((following, index) => {
                        showEpisode.push(getEpisodes(following.title))
                    })
                    Promise.all(showEpisode)
                        .then((results) => {
                            console.log('All episodes from followed shows has been saved:', results)
                            resolve()
                        })
                } else {
                    reject('Cannot find following.json')
                }
            })

        })
    }

    // Returns all shows w/ all episodes
    json_module['getLibrary'] = function getLibrary() {
        return new Promise(function(resolve, reject) {
            let library = []
            fsExtra.readdirSync('./backend/json/episodes')
                .filter((file) => {
                    let dashedShowName = file.split('.json')
                    dashedShowName = dashedShowName[0]
                    let showName = dashedShowName.replace('-', ' ')
                    showName = showName.replace('-', ' ')
                    let show = {
                        title: showName,
                        poster: './res/posters/' + dashedShowName + '.jpg',
                        episodes: []
                    }
                    fsExtra.readFile('./backend/json/episodes/' + file, (err, showEpisodes) => {
                        if (err) throw err
                        if (showEpisodes) {
                            let episodes = JSON.parse(showEpisodes)
                            show.episodes = episodes
                        }
                    })
                    library.push(show)
                })
            resolve(library)

        })
    }


    return json_module
}

exports['@singleton'] = true
exports['@require'] = ['services/common-service']
