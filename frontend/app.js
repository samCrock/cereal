angular.module('CerealApp', ['ngMaterial', 'ngMdIcons'])
    .controller('mainCtrl', ['$scope', '$interval', function($scope, $interval) {

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let ioc = require('./ioc')
        let logUpdate = require('log-update')
        let util = require('util')

        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')
        let jsonService = ioc.create('services/json-service')
        let subService = ioc.create('services/subs-service')
        let posterService = ioc.create('services/poster-service')

        // jsonService.updateFollowingEpisodes()
        // jsonService.getLibrary()

        $scope.locals = []
        $scope.following = []

        jsonService.getCompleted().then((completed) => {
            console.log('Completed --->', completed)
            $scope.locals = completed
            $scope.$apply()
        })

        jsonService.getLibrary().then((library) => {
            console.log('Library --->', library)
        })

        fsExtra.readFile('./backend/json/following.json', (err, data) => {
            if (data) {
                data = JSON.parse(data)
                let missingPosters = []
                data.filter((show) => {
                    if (!show.poster) {
                        missingPosters.push(posterService.downloadPoster(show.title))
                    }
                    $scope.following.push(show)
                })
                $scope.$apply()
                Promise.all(missingPosters)
                    .then((results) => {
                        results.filter((f) => {
                            console.log('f---->', f)
                                // $scope.following.push(show)
                        })
                    })
            }
        })


        jsonService.month().then(function(json) {
            console.log('This month calendar was successfully written!')
                // Search from my favourites
            fsExtra.readFile('./backend/json/following.json', (err, data) => {
                if (err) throw err;
                console.log('Searching for today\'s shows..')
                let following = JSON.parse(data)
                let searchCandidates = []
                let episodesToSearch = []

                let today = new Date()

                today.setDate(today.getDate() - 1)

                // console.log(json)
                for (var i = json.length - 1; i >= 0; i--) {
                    var nday = json[i].date
                    if (commonService.sameDay(today, nday)) {
                        console.log()
                        console.log(json[i].date_label)
                        console.log(json[i].shows)
                        console.log()
                        getMatch(json[i])
                    }
                }

                // Then cycle through dailyShows to match myFollowing   
                function getMatch(day) {
                    var dailyShows = day.shows
                    for (var i = following.length - 1; i >= 0; i--) {
                        var myTitle = following[i].title;
                        for (var j = dailyShows.length - 1; j >= 0; j--) {
                            if (myTitle.toUpperCase() === dailyShows[j].title.toUpperCase()) { // perfect match is bs!
                                let searchObj = {
                                    show: dailyShows[j].title,
                                    episode: dailyShows[j].episode
                                }
                                searchCandidates.push(searchObj)
                            }
                        }
                    }

                    // check if locals already contains current day shows, if true skip
                    $scope.locals.filter((local) => {
                        searchCandidates.filter((following, i) => {
                            let fString = following.show.toLowerCase() + following.episode.toLowerCase()
                            let lString = local.show.toLowerCase() + local.episode.toLowerCase()
                            if (fString === lString) searchCandidates.splice(i, 1)
                        })
                    })

                    console.log('searchCandidates', searchCandidates)
                    searchCandidates.filter((searchObj) => {
                        episodesToSearch.push(torrentService.searchTorrent(searchObj))
                    })

                    Promise.all(episodesToSearch).then(function(results) {

                        console.log()
                        console.log(results.length, 'instances found')
                        console.log()

                        let torrentsArray = []
                        if (results.length > 0) {
                            for (var i = results.length - 1; i >= 0; i--) {
                                if (typeof results[i] !== 'number') {
                                    following.filter((followed_show) => {
                                        if (followed_show.title.toLowerCase() === results[i].show.toLowerCase()) {
                                            results[i].poster = followed_show.poster
                                        }
                                    })
                                    if (results[i].title) {
                                        console.log('---> ', results[i])
                                        $scope.locals.push(results[i])
                                        torrentsArray.push(torrentService.downloadTorrent(results[i], $scope))
                                    } else {
                                        results = results.splice(i, 1)
                                    }
                                }
                            }
                            $scope.$apply()
                            Promise.all(torrentsArray).then((results) => {
                                console.log(':::Done:::')
                            })
                        } else {
                            return console.log('Nothing new today')
                        }
                    }).catch(function(e) {
                        return console.error('That\'s bullshit! ->', e)
                    })

                }

            })
        })



        //  Opens sys default app
        $scope.watch = (local) => {
            let fileName = local.path.split('/')
            fsExtra.readdir(local.path, (err, files) => {
                if (err) return console.error(err)
                files.filter((file) => {
                    let ext = file.split('.')
                    ext = ext[ext.length - 1]
                        // console.log(ext, local.extension)
                    if (ext === local.extension) {
                        console.log(local.path + '/' + file)
                        commonService.openFile(local.path + '/' + file)
                    }
                })
            })
        }

        // Called in search form
        $scope.search = () => {
            $scope.search_loading = true
            if ($scope.search.season.length === 1) $scope.search.season = '0' + $scope.search.season
            if ($scope.search.episode.length === 1) $scope.search.episode = '0' + $scope.search.episode
            torrentService.searchTorrent({
                show: $scope.search.show,
                episode: 'S' + $scope.search.season + 'E' + $scope.search.episode
            }).then((torrent) => {
                console.log('Torrent found:', torrent)
                torrent.show = commonService.getShowTitleFromTorrent(torrent)
                $scope.locals.push(torrent)
                $scope.search_loading = false
                $scope.$apply()
                torrentService.downloadTorrent(torrent, $scope).then(() => {
                    console.log('Done')
                })
            })
        }

    }])
    // require('./backend/main.js')

require('../backend/services/torrent-service.js')
require('../backend/services/json-service.js')
require('../renderer.js')
