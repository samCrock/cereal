(function() {
    'use strict';

    angular
        .module('app')
        .controller('calendarCtrl', calendarCtrl);

    function calendarCtrl($rootScope, $scope, $interval, jsonService, posterService, commonService, torrentService) {
        console.log('Calendar')
        let fsExtra = require('fs-extra')

        $rootScope.loading = true

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
                        $rootScope.loading = false
                        $rootScope.msg = ''

                        let posterTitles = []
                        if (data) {
                            let posters = []
                            let showsToUpdate = []
                            data.filter((day) => {
                                // LAST WEEK ONLY
                                if (new Date(day.date) > _8daysago && new Date(day.date) < new Date()) {
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
                            console.log('Showing', $rootScope.days);
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

    }

})();
