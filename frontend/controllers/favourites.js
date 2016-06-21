angular.module('App')
    .controller('favouritesCtrl', ['$scope', '$interval', function($scope, $interval) {

        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let logUpdate = require('log-update')
        let util = require('util')

        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')
        let jsonService = ioc.create('services/json-service')
        let subService = ioc.create('services/subs-service')
        let posterService = ioc.create('services/poster-service')

        $scope.default_poster = './res/posters/default.jpg'

        // jsonService.updateFollowingEpisodes()
        // jsonService.getLibrary()

        $scope.locals = []
        $scope.following = []

        jsonService.getCompleted().then((completed) => {
            console.log('Completed --->', completed)
            $scope.locals = completed
            $scope.$apply()
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


        jsonService.month().then((json) => {
            console.log('This month calendar was successfully written!')
                // Search from my favourites
            fsExtra.readFile('./backend/json/following.json', (err, data) => {
                if (err) throw err;
                console.log('Searching for today\'s shows..')
                let following = JSON.parse(data)
                let searchCandidates = []
                let episodesToSearch = []

                let today = new Date()

                today.setDate(today.getDate())

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


    }])
