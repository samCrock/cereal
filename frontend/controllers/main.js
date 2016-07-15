angular.module('App')
    .controller('mainCtrl', ['$scope', '$interval', '$state', '$rootScope', function($scope, $interval, $state, $rootScope) {

        let ioc = require('../../ioc')

        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let logUpdate = require('log-update')
        let util = require('util')

        let jsonService = ioc.create('services/json-service')
        let subService = ioc.create('services/subs-service')
        let posterService = ioc.create('services/poster-service')

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
            $rootScope.loading = true
        })
        
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {
            // console.log('event', event)
            // console.log('toState', toState)
            // console.log('toParams', toParams)
            // console.log('fromState', fromState)
            // console.log($scope.currentNavItem)
            if (toState.name === 'app.episode') {
                $scope.isBack = true
            } else $scope.isBack = false
        })

        $scope.currentNavItem = 'calendar'
        $state.go('app.calendar')
        
        $scope.back = () => {
            if ($state.includes('app.episode')) $state.go('app.calendar')
        }

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
                $rootScope.locals.push(torrent)
                $scope.search_loading = false
                $scope.$apply()
                torrentService.downloadTorrent(torrent, $scope).then(() => {
                    console.log('Done')
                })
            })
        }


        $scope.default_poster = './res/posters/default.jpg'

        // jsonService.updateFollowingEpisodes()
        // jsonService.getLibrary()

        $rootScope.locals = []

        jsonService.getCompleted().then((completed) => {
            console.log('Completed --->', completed)
            $rootScope.locals = completed
            $scope.$apply()
        })

        jsonService.getLibrary().then((library) => {
            console.log('Library --->', library)
        })


        jsonService.month().then((json) => {
            console.log('This month calendar was successfully written!')
                // Search from my favourites
            fsExtra.readFile('./backend/json/following.json', (err, data) => {
                if (err) throw err;
                console.log('Searching for today\'s shows..')
                let following = JSON.parse(data)
                let searchCandidates =  []
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
                    $rootScope.locals.filter((local) => {
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
                                        $rootScope.locals.push(results[i])
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
