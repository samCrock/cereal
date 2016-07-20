angular.module('App')
    .controller('calendarCtrl', ['$rootScope', '$scope', '$interval', function($rootScope, $scope, $interval) {
        console.log('Calendar')
        $rootScope.loading = false
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')
        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')

        $scope.days = []
        let today = new Date()
        let _7daysago = new Date()
        today.setHours(0, 0, 0, 0)
        _7daysago.setDate(today.getDate() - 7)

        // $scope.streamEpisode = (show) => {
        //     show.loading = true
        //     torrentService.streamEpisode({ show: show.title, episode: show.episode })
        // }

        $scope.downloadEpisode = (showObj) => {
            let show = showObj.show 
            let episode = showObj.episode
            torrentService.searchTorrent({
                    show: show,
                    episode: episode
                })
                .then((result) => {
                    torrentService.downloadTorrent(result, $rootScope)
                        .then(() => {
                            console.log(show, episode, 'finished downloading')
                        })
                })
        }


        jsonService.getLocalPosters()
            .then((local_posters) => {

                fsExtra.readFile('./backend/json/monthly.json', (err, data) => {
                    let posterTitles = []
                    if (data) {
                        data = JSON.parse(data)
                        let posters = []
                        let showsToUpdate = []
                        data.filter((day) => {
                            if (new Date(day.date) > _7daysago) {
                                day.dateObj = commonService.getDayObject(day.date)
                                    // $scope.days.push(day)
                                day.shows.filter((show) => {
                                    let dashedTitle = commonService.spacedToDashed(show.title)
                                    let index = local_posters.indexOf(dashedTitle)
                                    if (index >= 0) {
                                        let posterPath = './res/posters/' + local_posters[index] + '.jpg'
                                            // console.log('--poster found--')
                                        show.poster = posterPath
                                    } else {
                                        // posters.push(posterService.getPosterUrl(show.title))
                                        console.log('Poster to download:', show.title)
                                        posters.push(posterService.downloadPoster(show.title))
                                    }
                                })
                                $scope.days.push(day)
                                $scope.$apply()
                            }
                        })
                        Promise.all(posters)
                            .then((results) => {
                                console.log('--- All posters found ---')
                                $scope.days.filter((day, i) => {
                                        day.shows.filter((show, j) => {
                                            results.filter((poster) => {
                                                if (poster && poster.title.toLowerCase() === show.title.toLowerCase()) {
                                                    showsToUpdate.push({ title: show.title.toLowerCase(), poster: poster.poster })
                                                    $scope.days[i].shows[j].poster = poster.poster
                                                    $scope.$apply()
                                                        // next()
                                                }
                                            })
                                        })
                                    })
                                    // Update Following w/ the new poster paths
                                jsonService.updateFollowing(showsToUpdate)
                            })
                    }
                })
            })


    }])
