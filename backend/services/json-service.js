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
                    data.filter((show) => {
                        if (!show.poster) {

                        }
                        following.push(show)
                    })
                    resolve(following)
                }
            })
        })
    }

    // Used to add poster location after download (from array)
    json_module['updateFollowing'] = function updateFollowing(shows) {
        return new Promise(function(resolve, reject) {
            let data = fsExtra.readFileSync('./backend/json/following.json', 'utf8')
            if (data) { // Following exists
                let json = JSON.parse(data)
                json.filter((following, index) => {
                        shows.filter((showObj, index) => {
                            // console.log(following.title.toLowerCase(), showObj.title.toLowerCase())
                            if (following.title.toLowerCase() === showObj.title.toLowerCase()) {
                                console.log('Updating', showObj.title)
                                following.poster = showObj.poster
                            }
                        })
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

    // Returns torrent object given the torrent title
    json_module['getLocalTorrent'] = function getLocalTorrent(title) {
        return new Promise(function(resolve, reject) {
            // console.log('local title', title)
            fsExtra.readFile('./backend/json/local_torrents.json', (err, data) => {
                if (data) { // Locals exists
                    let json = JSON.parse(data)
                    json.filter((torrent) => {
                        // console.log('torrent title', torrent.title)
                        if (torrent.title === title) {
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

    // Returns all downloaded poster show names
    json_module['getLocalPosters'] = function getLocalPosters() {
        return new Promise(function(resolve, reject) {
            let local_posters = []
            fsExtra.readdirSync('./res/posters')
                .filter((file) => {
                    let dashedShowName = file.split('.jpg')
                    dashedShowName = dashedShowName[0]
                    local_posters.push(dashedShowName)
                })
            resolve(local_posters)

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
            // console.log('-----getEpisodeInfo-----')
            let dashedShowName = commonService.spacedToDashed(t.show)
            let tSeason = t.episode.substr(1, 2)
            let tEpisode = t.episode.substr(4, 5)
            fsExtra.readFile('./backend/json/episodes/' + dashedShowName + '.json', (err, data) => {
                if (err) {
                    // console.error('Cannot retrieve episode list for', dashedShowName)
                    // resolve(t)
                    console.log('Fetching show episodes', t.show)
                    getEpisodes(t.show).then((episodes) => {
                        getEpisodeInfo(t).then((info) => {
                            resolve(info)
                        })
                    })
                }
                if (data) {
                    console.log('Updating show episode', t.show)
                    getEpisodes(t.show).then((episodes) => {
                        // let episodes = JSON.parse(data)
                        console.log('episodes ->', episodes)
                        episodes.filter((ep) => {
                            if (ep.season === tSeason && ep.episode === tEpisode) {
                                console.log('   Title ->', ep.title, ep.date)
                                t.date_label = ep.date
                                t.date = new Date(ep.date)
                                t.episode_title = ep.title
                                resolve(t)
                                    // getEpisodeInfo(t)
                            }

                        })
                    })
                }
            })

        })
    }

    // Writes month.json and returns current month's shows calendar
    json_module['month'] = function month() {
        return new Promise(function(resolve, reject) {
            const now = new Date()
            var year = now.getFullYear()
            var month = now.getMonth()
            if (month < 10) {
                month = month.toString()
                month = '0' + month
            }


            var months = [(parseInt(month) - 1) + '-' + year, month + '-' + year, (parseInt(month) + 1) + '-' + year]
            var promises = []
            console.log(url + months[0])

            for (var i = months.length - 1; i >= 0; i--) {
                promises.push(new Promise(function(resolve, reject) {
                    request(url + months[i], function(error, response, html) {

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

                            resolve(json)
                                // // Write monthly.json with all the info regarding the shows
                                // fsExtra.writeFile('./backend/json/monthly.json', JSON.stringify(json, null, 4), function(err) {
                                //     resolve(json)
                                // })
                        }
                    })
                }))
            }

            Promise.all(promises).then((data) => {
                var days = []
                for (var i = data.length - 1; i >= 0; i--) {
                    for (var j = data[i].length - 1; j >= 0; j--) {
                        days.push(data[i][j])
                    }
                }
                days.sort( (a, b) => {
                    var c = new Date(a.date);
                    var d = new Date(b.date);
                    return c - d;
                });
                // console.log('days', days)
                    // Write monthly.json with all the info regarding the shows
                fsExtra.writeFile('./backend/json/monthly.json', JSON.stringify(days, null, 4), function(err) {
                    resolve(days)
                })
            })

        })

    }

    // Writes and returns target show episode list
    let getEpisodes = json_module['getEpisodes'] = function getEpisodes(show) {
        return new Promise(function(resolve, reject) {

            show = commonService.spacedToDashed(show)

            console.log('Searching Trakt for: ' + show)
            console.log()

            let urlMain = 'https://trakt.tv/shows/' + show

            request.get({ url: urlMain }, function(error, response, body) {

                if (error || !response) return reject(error)

                console.log('Status', response.statusCode);

                if (!error && response.statusCode == 200) {

                    let $ = cheerio.load(body)
                    let seasons = $('#seasons')['0'].children[0].children[0].data
                    console.log('seasons', seasons)
                    let currentSeason = seasons
                    let episodes = []
                    while (currentSeason > 0) {
                        let urlSeasons = 'https://trakt.tv/shows/' + show + '/seasons/' + currentSeason
                        request.get({ url: urlSeasons }, function(error, response, body) {
                            if (error || !response) return reject(error)
                            if (!error && response.statusCode == 200) {
                                let $ = cheerio.load(body)
                                    // console.log('Titles', $('.titles'))
                                for (var i = $('.titles').length - 1; i >= 0; i--) {
                                    if (i !== 1) {
                                        if ($('.titles')[i].children.length == 2) {
                                            // console.log('Title Regular', i, $('.titles')[i])
                                            let ep = $('.titles')[i].children[0].children[1].children[0].children[0].data
                                            let title = $('.titles')[i].children[0].children[1].children[2].children[0].data
                                            let date = $('.titles')[i].children[1].children[0].children[0].children[0].data
                                                // console.log('      ep', ep)
                                                // console.log('   title', title)
                                                // console.log('    date', date)
                                            episodes.push({
                                                episode: ep,
                                                title: title,
                                                date: date
                                            })
                                        } else if ($('.titles')[i].children.length == 6) {
                                            // console.log('Title Premiere', i, $('.titles')[i])
                                            let ep = $('.titles')[i].children[2].children[0].children[0].data
                                            let title = $('.titles')[i].children[2].children[2].children[0].data
                                            let date = $('.titles')[i].children[1].children[0].children[0].data
                                                // console.log('      ep', ep)
                                                // console.log('   title', title)
                                                // console.log('    date', date)
                                            episodes.push({
                                                episode: ep,
                                                title: title,
                                                date: date
                                            })
                                        }
                                    }
                                }
                                fsExtra.writeFile('./backend/episodes/' + show + '.json', JSON.stringify(episodes, null, 4), function(err) {
                                    if (err) {
                                        reject('Cannot write file :', err)
                                    } else {
                                        console.log(show, 'episodes list written!')
                                        resolve(episodes)

                                    }
                                })
                            } else resolve(response.statusCode)
                        })
                        currentSeason--
                    }


                } else resolve(response.statusCode)
            })
        })
    }

    // Get all shows from following.json and populates episode dir w/ episodes list
    json_module['updateFollowingEpisodes'] = function updateFollowingEpisodes() {
        return new Promise(function(resolve, reject) {
            fsExtra.readFile('./backend/json/following.json', (err, data) => {

                if (err) throw err
                if (data) { // Locals exists

                    let json = JSON.parse(data)
                    let showEpisode = []
                    json.filter((following, index) => {
                        console.log('Updating', following.title, 'episode list')
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
                    let showName = dashedShowName.split(' ').join('-')
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
