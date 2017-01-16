    (function() {
        'use strict';

        angular
            .module('app')
            .service('jsonService', jsonService);

        /* @ngInject */
        function jsonService(commonService, $rootScope) {

            let request = require('request')
            let cheerio = require('cheerio')
            let Promise = require('bluebird')
            let fsExtra = require('fs-extra')

            let url = 'http://www.pogdesign.co.uk/cat/'
            let json
            let json_module = {}

            json_module['getFollowing'] = function getFollowing() {
                return new Promise((resolve, reject) => {
                    let following = []
                    fsExtra.readFile('./data/json/following.json', (err, data) => {
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

            json_module['getShowEpisodes'] = function getShowEpisodes(show) {
                return new Promise((resolve, reject) => {
                    console.log('Retrieving local episodes info..')
                    show = commonService.spacedToDashed(show)
                    fsExtra.readFile('./data/shows/' + show + '.json', (err, data) => {
                        if (err) reject(err)
                        if (data) {
                            data = JSON.parse(data)
                            console.log('Retrieved', data.length, 'episodes')
                            resolve(data)
                        }
                    })
                })
            }

            json_module['updateShowEpisodes'] = function updateShowEpisodes(show, episodes) {
                return new Promise((resolve, reject) => {
                    console.log('Retrieving remote episodes info..')
                    show = commonService.spacedToDashed(show)
                    fsExtra.outputFile('./data/shows/' + show + '.json', JSON.stringify(episodes, null, 4), function(err) {
                        if (err) {
                            reject('Cannot write file :', err)
                        } else {
                            console.log(show, 'episodes list updated!')
                            resolve(episodes)
                        }
                    })
                })
            }

            // Returns poster path given the show name
            json_module['getPoster'] = function getPoster(showName) {
                return new Promise(function(resolve, reject) {
                    // console.log('showName', showName)
                    fsExtra.readFile('./data/json/following.json', (err, data) => {
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
                    fsExtra.readFile('./data/json/local_torrents.json', (err, data) => {
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
                    fsExtra.readFile('./data/json/local_torrents.json', (err, data) => {
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


            // // Updates local_torrents given a torrent object
            // json_module['updateLibrary'] = function updateLibrary(torrent_object) {
            //     // return new Promise(function(resolve, reject) {
            //     console.log('_____', torrent_object, '_____')
            //     fsExtra.readFile('./data/json/local_torrents.json', (err, data) => {
            //         if (err) throw err
            //         var json = []
            //         if (data) { // Locals exists
            //             json = JSON.parse(data)
            //             json.filter((jsonObj, i) => {
            //                 if (jsonObj.title === torrent_object.title) json.splice(i, 1)
            //             })
            //             json.push(torrent_object)
            //             fsExtra.outputFile('./data/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
            //                 if (err) reject('Cannot write file :', err)
            //                     // console.log(torrent_object.title, 'added')
            //                 return json
            //             })
            //         } else { // first entry
            //             json.push(torrent_object)
            //             fsExtra.outputFile('./data/json/local_torrents.json', JSON.stringify(json, null, 4), function(err) {
            //                 if (err) reject('Cannot write file :', err)
            //                 return json
            //             })
            //         }
            //     })

            //     // })
            // }

            // // Returns additional episode info (date + ep title) given a torrent objecct
            // json_module['getEpisodeInfo'] = function getEpisodeInfo(t) {
            //     return new Promise(function(resolve, reject) {

            //         // console.log('-----getEpisodeInfo-----')
            //         let dashedShowName = commonService.spacedToDashed(t.show)
            //         let tSeason = t.episode.substr(1, 2)
            //         let tEpisode = t.episode.substr(4, 5)
            //         fsExtra.readFile('./data/shows/' + dashedShowName + '.json', (err, data) => {
            //             if (err) {
            //                 console.log('Fetching show episodes', t.show)
            //                 getShow(t.show).then((episodes) => {
            //                     getEpisodeInfo(t).then((info) => {
            //                         resolve(info)
            //                     })
            //                 })
            //             }
            //             if (data) {
            //                 console.log('Updating show episode', t.show)
            //                 getShow(t.show).then((episodes) => {
            //                     // console.log('episodes ->', episodes)
            //                     episodes.filter((ep) => {
            //                         if (ep.season === tSeason && ep.episode === tEpisode) {
            //                             console.log('   Title ->', ep.title, ep.date)
            //                             t.date_label = ep.date
            //                             t.date = new Date(ep.date)
            //                             t.episode_title = ep.title
            //                             resolve(t)
            //                                 // getEpisodeInfo(t)
            //                         }

            //                     })
            //                 })
            //             }
            //         })

            //     })
            // }

            // Writes month.json and returns current month's shows calendar
            json_module['month'] = function month() {
                return new Promise(function(resolve, reject) {


                    function update() {

                        return new Promise(function(resolve, reject) {
                            const now = new Date()
                            localStorage.lastUpdate = now
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
                                                                        title = commonService.findAliasSync(title)
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
                                                // fsExtra.outputFile('./data/json/monthly.json', JSON.stringify(json, null, 4), function(err) {
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
                                days.sort((a, b) => {
                                    var c = new Date(a.date);
                                    var d = new Date(b.date);
                                    return c - d;
                                });
                                // console.log('days', days)
                                // Write monthly.json with all the info regarding the shows
                                fsExtra.outputFile('./data/monthly.json', JSON.stringify(days, null, 4), function(err) {
                                    resolve(days)
                                })
                            })
                        })
                    }


                    let sinceLastUpdate = commonService.daysToNow(localStorage.lastUpdate)
                    console.log(sinceLastUpdate + ' days since last update')
                    if (localStorage.lastUpdate && sinceLastUpdate < 1) {
                        fsExtra.readFile('./data/monthly.json', (err, data) => {
                            if (err) {
                                resolve(update())
                            } else {
                                console.log('Retrieved local calendar')
                                data = JSON.parse(data)
                                resolve(data)
                            }
                        })
                    } else {
                        resolve(update())
                    }
                })


            }

            // Writes and returns target show episode list
            let getShow = json_module['getShow'] = function getShow(show) {
                return new Promise(function(resolve, reject) {

                    show = commonService.spacedToDashed(show)

                    // Search for local episode file, if not found, retrieve from trakt
                    fsExtra.readFile('./data/shows/' + show + '.json', (err, data) => {
                        // if (data) { // Locals exists
                        //     console.log('FOUND LOCAL DATA')
                        //     let json = JSON.parse(data)
                        //     let episodes = []
                        //     resolve(json)
                        // }
                        // if (err) {
                        commonService.findAlias(show)
                            .then((result) => {
                                // console.log('commonService.findAlias RESULT->', result)
                                show = result
                                retrieveRemote(show)
                            })
                            .catch((err) => {
                                // console.log('commonService.findAlias REJECT->', show)
                                retrieveRemote(show)
                            })
                            // }
                    })

                    function retrieveRemote(show) {

                        let urlMain = 'https://trakt.tv/shows/' + show

                        console.log('https://trakt.tv/shows/' + show)
                        console.log()

                        request.get({
                            url: urlMain
                        }, function(error, response, body) {

                            if (error || !response) reject(error)

                            console.log('Status', response.statusCode);

                            if (response.statusCode !== 200) reject(response.statusCode)

                            if (!error && response.statusCode === 200) {
                                let $ = cheerio.load(body)
                                let showJson
                                let seasons, network, premiered, runtime, genres, overview, trailer, title
                                let genresArray = []

                                if ($('.additional-stats')['0'] && $('.additional-stats')['0'].children[0]) {
                                    title = commonService.capitalCase(show)
                                    seasons = $('.season-count')[1].attribs['data-all-count']
                                    network = $('.additional-stats')['0'].children[0].children[4].data
                                    network = network.split(' on ')
                                    network = network[1]
                                    genres = $('#overview')['0'].children[2].children[0].children[0].children[6].children
                                    premiered = $('#overview')['0'].children[2].children[0].children[0].children[1].children[2].attribs.content
                                    overview = $('#overview')[1].children[0].data
                                    trailer = $('.affiliate-links')['0'].children[0] ? $('.affiliate-links')['0'].children[0].children[1].attribs.href : ''
                                    runtime = $('#overview')['0'].children[2].children[0].children[0].children[2].children[1].data
                                    genres.filter((genre, i) => {
                                        if (i % 2 && i !== 0) genresArray.push(genre.children[0].data)
                                    })
                                    console.log('##########################')
                                    console.log('Title      :', title)
                                    console.log('Seasons    :', seasons)
                                    console.log('Network    :', network)
                                    console.log('Premiered  :', premiered)
                                    console.log('Runtime    :', runtime)
                                    console.log('Genres     :', genresArray)
                                    console.log('Overview   :', overview)
                                    console.log('Trailer    :', trailer)
                                    console.log('##########################')
                                    showJson = {
                                        Title: title,
                                        Network: network,
                                        Premiered: premiered,
                                        Runtime: runtime,
                                        Genres: genresArray,
                                        Overview: overview,
                                        Trailer: trailer,
                                        Seasons: {}
                                    }
                                }


                                if (showJson) $rootScope.$broadcast('show_overview', { show: showJson })
                                // fsExtra.outputFile('./data/shows/' + show + '.json', JSON.stringify(showJson, null, 4), function(err) {
                                //     if (err) {
                                //         reject('Cannot write file :', err)
                                //     } else {
                                //         console.log('Show info written!')
                                //         resolve(showJson)
                                //     }
                                // })

                                let currentSeason = seasons

                                while (currentSeason > 0) {
                                    let urlSeasons = 'https://trakt.tv/shows/' + show + '/seasons/' + currentSeason
                                    request.get({
                                        url: urlSeasons
                                    }, function(error, response, body) {
                                        if (error || !response) return reject(error)
                                        if (!error && response.statusCode == 200) {

                                            let $ = cheerio.load(body)

                                            currentSeason = $('.selected')[2].children[0].data
                                            showJson.Seasons[currentSeason] = {}
                                            let episode = 1

                                            for (var i = 1; i < $('.titles').length; i++) {

                                                if ($('.titles')[i].children.length == 2 && $('.titles')[i].children[0].children[1]) {
                                                    let date = $('.titles')[i].children[1].children[0].children[0].children[0].data
                                                    if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                                                    let ep = $('.titles')[i].children[0].children[1].children[0].children[0].data
                                                    let title = $('.titles')[i].children[0].children[1].children[2].children[0].data
                                                    if (ep.length == 4) ep = '0' + ep
                                                    ep = ep.slice(0, 2) + ep.slice(3)
                                                    ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                                                    ep = 's' + ep

                                                    showJson.Seasons[currentSeason][episode] = {
                                                        episode: ep,
                                                        title: title,
                                                        date: date
                                                    }
                                                    episode++
                                                } else if ($('.titles')[i].children.length == 6) {
                                                    let date = $('.titles')[i].children[1].children[0].children[0].data
                                                    if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                                                    let ep = $('.titles')[i].children[2].children[0].children[0].data
                                                    let title = $('.titles')[i].children[2].children[2].children[0].data
                                                    if (ep.length == 4) ep = '0' + ep
                                                    ep = ep.slice(0, 2) + ep.slice(3)
                                                    ep = ep.slice(0, 2) + 'e' + ep.slice(2)
                                                    ep = 's' + ep
                                                    showJson.Seasons[currentSeason][episode] = {
                                                        episode: ep,
                                                        title: title,
                                                        date: date
                                                    }
                                                    episode++
                                                }
                                            }
                                            // console.log(showJson)
                                            // console.log('Season ', currentSeason, showJson.Seasons[currentSeason])

                                            fsExtra.outputFile('./data/shows/' + show + '.json', JSON.stringify(showJson, null, 4), function(err) {
                                                if (err) {
                                                    reject('Cannot write file :', err)
                                                } else {
                                                    resolve(showJson)
                                                }
                                            })
                                        } else {
                                            resolve(response.statusCode)
                                        }
                                    })
                                    currentSeason--
                                }

                            } else reject(response.statusCode)
                        })
                    }
                })
            }

            // Get all shows from following.json and populates episode dir w/ episodes list
            json_module['updateFollowingEpisodes'] = function updateFollowingEpisodes() {
                return new Promise(function(resolve, reject) {
                    fsExtra.readFile('./data/json/following.json', (err, data) => {

                        if (err) throw err
                        if (data) { // Locals exists

                            let json = JSON.parse(data)
                            let showEpisode = []
                            json.filter((following, index) => {
                                console.log('Updating', following.title, 'episode list')
                                showEpisode.push(getShow(following.title))
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
                    fsExtra.readdirSync('./data/shows')
                        .filter((file) => {
                            let dashedShowName = file.split('.json')
                            dashedShowName = dashedShowName[0]
                            // let showName = dashedShowName.split(' ').join('-')
                            showName = commonService.capitalCase(showName)
                            let show = {
                                title: showName,
                                poster: './res/posters/' + dashedShowName + '.jpg',
                                episodes: []
                            }
                            fsExtra.readFile('./data/shows/' + file, (err, showEpisodes) => {
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
    })();
