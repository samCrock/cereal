(function() {
    'use strict';

    angular
        .module('app')
        .controller('calendarCtrl', calendarCtrl);

    function calendarCtrl($rootScope, $scope, $interval, jsonService, posterService, commonService, torrentService, dialogService) {
        console.log('Calendar')
        let fsExtra = require('fs-extra')

        $rootScope.loading = true

        $scope.posterOnly = (show) => {
            return show
        }
        $scope.scrollLeft = function(content_id) {
            var content = document.getElementById(content_id)
            content.scrollLeft -= 192 * 3 // scroll 3 shows (tmp)
        }
        $scope.scrollRight = function(content_id) {
            var content = document.getElementById(content_id)
            content.scrollLeft += 192 * 3 // scroll 3 shows (tmp)
        }

        $scope.stream = function(episode) {
            console.log('PLAY ->', episode)
            torrentService.searchTorrent({
                    show: episode.show,
                    episode: episode.episode
                })
                .then((t) => {
                    let streamObj = { magnet: t.magnet, path: __dirname + '/../../library/' + episode.show + '/' + episode.episode }
                    console.log('streamObj', streamObj)
                    commonService.stream(streamObj)
                })
                .catch((reason) => {
                    console.log(reason)
                })
        }

        $scope.playTrailer = function(show) {
            console.log(show)
            jsonService.getYTTrailer(show.show)
            .then( (url) => {
                dialogService.trailer({ src: url })
            })
        }


        $scope.download = (showObj) => {
            let show = showObj.show
            let episode = showObj.episode
            torrentService.searchTorrent({
                    show: show,
                    episode: episode
                })
                .then((result) => {
                    torrentService.downloadTorrent(result)
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
                                        dashedTitle = commonService.findAliasSync(dashedTitle)
                                        let index = local_posters.indexOf(dashedTitle)
                                        if (index >= 0) {
                                            let posterPath = 'assets/posters/' + local_posters[index] + '.jpg'
                                                // console.log('--poster found--')
                                            show.poster = posterPath
                                        } else {
                                            // console.log('Poster to download:', show.title)
                                            posters.push(posterService.downloadPoster(show.title))
                                        }
                                        // If this show is in my library && autodownload is enabled, download this episode
                                        let episodes = $rootScope.library[show.title]
                                        if (episodes && $rootScope.CONFIG.auto_download) {
                                            for (var i = 0; i < episodes.length; i++) {
                                                if (episodes[i].episode === show.episode) {
                                                    console.log('New episode found', show.title, show.episode)
                                                    $scope.download({
                                                        show: show.title,
                                                        episode: show.episode
                                                    })
                                                }
                                            }
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
