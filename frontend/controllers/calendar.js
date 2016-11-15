angular.module('App')
    .controller('calendarCtrl', ['$rootScope', '$scope', '$interval', function($rootScope, $scope, $interval) {
        console.log('Calendar')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')
        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')

        $rootScope.loading = true
            // $scope.streamEpisode = (show) => {
            //     show.loading = true
            //     torrentService.streamEpisode({ show: show.title, episode: show.episode })
            // }

        $scope.posterOnly = (show) => {
            // return show.poster
            return show
        }

        $scope.downloadEpisode = (showObj) => {
            let show = showObj.show
            let episode = showObj.episode
            torrentService.searchTorrent({
                    show: show,
                    episode: episode
                })
                .then((result) => {
                    torrentService.downloadTorrent(result, $rootScope)
                        .then((t) => {
                            console.log('downloadTorrent result', t)
                            if (typeof t !== Object) {
                                console.log('Unable to download', show, episode, '\nCode ->', t)
                            } else {
                                console.log(show, episode, 'finished downloading')
                            }
                        })
                })
        }

        if ($rootScope.reload) {

            $rootScope.days = []
            let today = new Date()
            let _8daysago = new Date()
            today.setHours(0, 0, 0, 0)
            _8daysago.setDate(today.getDate() - 8)

            $rootScope.msg = 'Retrieving posters'
            jsonService.getLocalPosters()
                .then((local_posters) => {
                    $rootScope.msg = 'Retrieving this month data'
                    jsonService.month().then((data) => {
                        // console.log('Month data:', data);
                        // fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
                        $rootScope.loading = false
                        $rootScope.msg = ''

                        let posterTitles = []
                        if (data) {
                            // data = JSON.parse(data)
                            let posters = []
                            let showsToUpdate = []
                            data.filter((day) => {
                                if (new Date(day.date) > _8daysago) {
                                    day.dateObj = commonService.getDayObject(day.date)
                                        // $rootScope.days.push(day)
                                    day.shows.filter((show) => {
                                        let dashedTitle = commonService.spacedToDashed(show.title)
                                        let index = local_posters.indexOf(dashedTitle)
                                        if (index >= 0) {
                                            let posterPath = './res/posters/' + local_posters[index] + '.jpg'
                                                // console.log('--poster found--')
                                            show.poster = posterPath
                                        } else {
                                            // console.log('Poster to download:', show.title)
                                            posters.push(posterService.downloadPoster(show.title))
                                        }
                                    })
                                    $rootScope.days.push(day)
                                    $scope.$apply()
                                }
                            })
                            $rootScope.reload = false


                            Promise.all(posters)
                                .then((results) => {
                                    console.log('--- All posters found ---')
                                    $rootScope.days.filter((day, i) => {
                                            day.shows.filter((show, j) => {
                                                results.filter((poster) => {
                                                    if (poster && poster.title.toLowerCase() === show.title.toLowerCase()) {
                                                        showsToUpdate.push({ title: show.title.toLowerCase(), poster: poster.poster })
                                                        $rootScope.days[i].shows[j].poster = poster.poster
                                                        $scope.$apply()
                                                            // next()
                                                    }
                                                })
                                            })
                                        })
                                        // Update Following w/ the new poster paths
                                    jsonService.updateFollowing(showsToUpdate)
                                })
                        } else {
                            $rootScope.loading = false

                        }

                    })
                })
        } else {
            $rootScope.loading = false
        }

    }])
