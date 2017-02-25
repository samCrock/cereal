    (function() {
        'use strict';

        angular
            .module('app')
            .service('jsonService', jsonService);

        /* @ngInject */
        function jsonService(commonService, $rootScope, $interval, $mdToast, dbService) {

            let request = require('request')
            let cheerio = require('cheerio')
            let Promise = require('bluebird')
            let fsExtra = require('fs-extra')

            let url = 'http://www.pogdesign.co.uk/cat/'
            let json
            let json_module = {}

            // Returns all downloaded poster show names
            json_module['getLocalPosters'] = function getLocalPosters() {
                return new Promise(function(resolve, reject) {
                    let local_posters = []
                    fsExtra.readdirSync(__dirname + '/../../assets/posters')
                        .filter((file) => {
                            let dashedShowName = file.split('.jpg')
                            dashedShowName = dashedShowName[0]
                            local_posters.push(dashedShowName)
                        })
                    resolve(local_posters)

                })
            }

            // Get youtube trailer from show title
            json_module['getYTTrailer'] = function getYTTrailer(show) {
                return new Promise(function(resolve, reject) {
                    show = show.toLowerCase().split(' ').join('+')
                    request('https://www.youtube.com/results?search_query=' + show + 'show+trailer', function(error, response, body) {
                        if (!error) {
                            console.log('YT url: ', 'https://www.youtube.com/results?search_query=' + show + '+trailer')
                            console.log('Trailer candidates')
                            let $ = cheerio.load(body)
                            console.log('YouTube results ->', $('.item-section')['0'])
                            let firstResultId = $('.item-section')['0'].children[1].children[0].attribs['data-context-item-id']
                            if (!firstResultId) firstResultId = $('.item-section')['0'].children[3].children[0].attribs['data-context-item-id']
                            console.log('YouTube first result id->', firstResultId)
                            let url = 'https://www.youtube.com/watch?v=' + firstResultId
                            console.log('Url ->', url)
                            resolve(url)
                        } else {
                            reject()
                        }
                    })
                })
            }

            // Writes and returns target show episode list
            let getShow = json_module['getShow'] = function getShow(show) {
                return new Promise(function(resolve, reject) {

                    show = commonService.spacedToDashed(show)

                    // Search for local episode file, if not found, retrieve from trakt
                    // fsExtra.readFile(__dirname + '/../../data/shows/' + show + '.json', (err, data) => {
                    dbService.get(show)
                        .then((showJson) => {
                            if (commonService.daysToNow(showJson.Updated) < 7) {
                                console.log('Local data is fresh!', showJson.Updated, commonService.daysToNow(showJson.Updated))
                                resolve(showJson)
                            } else {
                                retrieveRemote(show)
                            }
                        })
                        .catch(() => {
                            commonService.findAlias(show)
                                .then((result) => {
                                    show = result
                                    retrieveRemote(show)
                                })
                                .catch(() => {
                                    retrieveRemote(show)
                                })
                        })
                        // })

                    function retrieveRemote(show) {

                        let urlMain = 'https://trakt.tv/shows/' + show

                        console.log('https://trakt.tv/shows/' + show)
                        console.log()

                        request.get({
                            url: urlMain
                        }, function(error, response, body) {

                            if (error || !response || !response.satus) reject(error)

                            console.log('Status', response.statusCode);

                            if (response.statusCode !== 200) reject(response.statusCode)

                            if (!error && response.statusCode === 200) {
                                let $ = cheerio.load(body)
                                let showJson
                                let seasons, network, premiered, runtime, genres, overview, trailer, title, wallpaper
                                let genresArray = []
                                console.log('.additional-stats', $('.additional-stats')['0'].children[0])
                                if ($('.additional-stats')['0'] && $('.additional-stats')['0'].children[0]) {
                                    title = commonService.capitalCase(show)
                                    seasons = $('.season-count')[1].attribs['data-all-count']
                                    network = $('.additional-stats')['0'].children[0].children[4] ? $('.additional-stats')['0'].children[0].children[4].data : ''
                                    network = network.split(' on ')
                                    network = network[1]
                                    genres = $('#overview')['0'].children[2].children[0].children[0].children[6].children
                                    premiered = $('#overview')['0'].children[2].children[0].children[0].children[1].children[2] ? $('#overview')['0'].children[2].children[0].children[0].children[1].children[2].attribs.content : ''
                                    overview = $('#overview')[1].children[0].data
                                    trailer = $('.affiliate-links')['0'].children[0] ? $('.affiliate-links')['0'].children[0].children[1].attribs.href : ''
                                    runtime = $('#overview')['0'].children[2].children[0].children[0].children[2].children[1].data
                                    runtime = runtime ? runtime.split(' mins').join('') : ''
                                    genres.filter((genre, i) => {
                                        if (i % 2 && i !== 0 && genre.children) genresArray.push(genre.children[0].data)
                                    })
                                    wallpaper = $('#summary-wrapper')['0'].attribs['data-fanart']
                                    console.log('##########################')
                                    console.log('Title      :', title)
                                    console.log('Seasons    :', seasons)
                                    console.log('Network    :', network)
                                    console.log('Premiered  :', premiered)
                                    console.log('Runtime    :', runtime)
                                    console.log('Genres     :', genresArray)
                                    console.log('Overview   :', overview)
                                    console.log('Trailer    :', trailer)
                                    console.log('Wallpaper  :', wallpaper)
                                    console.log('##########################')
                                    showJson = {
                                        Updated: new Date,
                                        Title: title,
                                        Network: network,
                                        Premiered: premiered,
                                        Runtime: runtime,
                                        Genres: genresArray,
                                        Overview: overview,
                                        Trailer: trailer,
                                        Wallpaper: wallpaper,
                                        Seasons: {}
                                    }
                                }

                                $rootScope.$broadcast('show_overview', { show: showJson })

                                let currentSeason = seasons
                                let seasonPromises = []
                                let lastSeason

                                $interval(() => {
                                    if (lastSeason !== currentSeason  && currentSeason !== 0) {
                                        lastSeason = currentSeason
                                        let urlSeason = 'https://trakt.tv/shows/' + show + '/seasons/' + currentSeason
                                        request.get({
                                            url: urlSeason
                                        }, function(error, response, body) {
                                            if (!error) {
                                                getSeason(error, response, body)
                                                currentSeason--
                                            }
                                        })
                                    }
                                }, 200)

                                function getSeason(error, response, body) {
                                    if (error || !response) return reject(error)
                                    if (!error && response.statusCode == 200) {

                                        let $ = cheerio.load(body)

                                        currentSeason = $('.selected')[2].children[0].data
                                        showJson.Seasons[currentSeason] = {}
                                        let episode = 1

                                        for (var i = 1; i < $('.titles').length; i++) {

                                            if ($('.titles')[i].children.length == 2 && $('.titles')[i].children[0].children[1]) {
                                                let title
                                                let date = $('.titles')[i].children[1].children[0].children[0].children[0].data
                                                if ($('.titles')[i].children[1].children[0].children[0].name === 'h4') date = $('.titles')[i].children[1].children[0].children[0].next.next.children[0].data
                                                let ep = $('.titles')[i].children[0].children[1].children[0].children[0].data
                                                if ($('.titles')[i].children[0].children[1].children[2].children[0]) {
                                                    title = $('.titles')[i].children[0].children[1].children[2].children[0].data
                                                }
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

                                        let valid = false
                                        for (var ep in showJson.Seasons) {
                                            if (ep.hasOwnProperty(showJson.Seasons)) {
                                                console.log(ep + " -> " + showJson.Seasons[ep])
                                            }
                                        }

                                        console.log('Saved seasons:', Object.keys(showJson.Seasons).length, '/', seasons)
                                        $mdToast.show($mdToast.simple().textContent('Saved seasons: ' + Object.keys(showJson.Seasons).length + ' / ' + seasons))
                                        if (Object.keys(showJson.Seasons).length === parseInt(seasons)) {
                                            
                                            dbService.put(show, showJson)
                                            .then(()=>{
                                                $rootScope.$broadcast('show_ready', showJson)
                                            })
                                            .catch((err)=>{
                                                console.error(err)
                                                reject(err)
                                            })
                                        }
                                    } else {
                                        reject(response.statusCode)
                                    }
                                }

                            } else reject('Status:', response.statusCode)
                        })
                    }
                })
            }

            // // Returns all shows w/ all episodes
            // json_module['getLibrary'] = function getLibrary() {
            //     return new Promise(function(resolve, reject) {
            //         let library = []
            //         fsExtra.readdirSync(__dirname + '/../../data/shows')
            //             .filter((file) => {
            //                 let dashedShowName = file.split('.json')
            //                 dashedShowName = dashedShowName[0]
            //                     // let showName = dashedShowName.split(' ').join('-')
            //                 showName = commonService.capitalCase(showName)
            //                 let show = {
            //                     title: showName,
            //                     poster: dashedShowName + '.jpg',
            //                     episodes: []
            //                 }
            //                 fsExtra.readFile(__dirname + '/../../data/shows/' + file, (err, showEpisodes) => {
            //                     if (err) throw err
            //                     if (showEpisodes) {
            //                         let episodes = JSON.parse(showEpisodes)
            //                         show.episodes = episodes
            //                     }
            //                 })
            //                 library.push(show)
            //             })
            //         resolve(library)

            //     })
            // }


            return json_module

        }
    })();
