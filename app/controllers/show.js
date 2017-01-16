(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, subsService, commonService, wtService, messageService) {

        let fsExtra = require('fs-extra')

        $rootScope.loading = true
        console.log('$stateParams', $stateParams)
        $scope.title = commonService.capitalCase($stateParams.show.trim())
        $rootScope.current_show = $scope.title
        $scope.downloading = []
        console.log($scope.title)

        $rootScope.$on('completed', (showObj) => {
            start()
        })

        $scope.dotClass = function(episode) {
            if (episode.downloaded) return 'green'
            if (episode.timePassed && episode.timePassed.indexOf('ago') === -1) return 'hidden'
            return ''
        }

        $scope.stream = function(episode) {
            console.log('PLAY ->', episode)
            torrentService.searchTorrent({
                    show: $scope.title,
                    episode: episode.episode
                })
                .then((t) => {
                    let streamObj = { magnet: t.magnet, path: process.cwd() + '/library/' + $scope.title + '/' + episode.episode }
                    console.log('streamObj', streamObj)
                    commonService.stream(streamObj)
                })
                .catch((reason) => {
                    console.log(reason)
                    messageService.notify({ title: 'Sorry', content: 'No results' })
                })
        }

        $scope.play = function(episode) {
            if (episode.downloaded) $state.go('app.episode', ({ show: $scope.title, episode: episode.episode }))
        }

        $interval(() => {
            if ($rootScope.pending && $scope.show && $scope.show.Seasons) {
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    for (var s in $scope.show.Seasons) {
                        for (var e in $scope.show.Seasons[s]) {
                            if ($rootScope.pending[i].show === $scope.show.Title &&
                                $rootScope.pending[i].episode === $scope.show.Seasons[s][e].episode) {
                                $scope.show.Seasons[s][e].eta = commonService.formatTime($rootScope.pending[i].eta)
                                console.log('downloading', $scope.show.Seasons[s][e].episode)
                            }
                        }
                    }
                }
            }
            if (!$scope.$$phase) {
                $scope.$apply()
            }
        }, 1000)

        function start() {
            jsonService.getShow($scope.title)
                .then((showResult) => {
                    var formatted_date = {}
                    console.log('showResult', showResult)
                    if (showResult) {
                        for (var season in showResult.Seasons) {
                            for (var episode in showResult.Seasons[season]) {
                                formatted_date = commonService.getDayObject(showResult.Seasons[season][episode].date)
                                showResult.Seasons[season][episode].dotw = formatted_date.dotw
                                showResult.Seasons[season][episode].dotm = formatted_date.dotm
                                showResult.Seasons[season][episode].month = formatted_date.month
                                showResult.Seasons[season][episode].timePassed = commonService.timePassed(showResult.Seasons[season][episode].date)
                                JSON.parse(localStorage.getItem('library')).filter((d) => {
                                    if (d.show === showResult.Title && d.episode === showResult.Seasons[season][episode].episode && !showResult.Seasons[season][episode].eta) {
                                        showResult.Seasons[season][episode].downloaded = true
                                    }
                                })
                            }
                        }
                    }
                    $scope.show = showResult
                    $scope.selectedIndex = 1

                    $rootScope.loading = false
                    $scope.$apply()
                }).catch((errorMsg) => {
                    console.error(errorMsg)
                })
        }

        $rootScope.$on('show_overview', function(event, result) {
            console.log('Overview ready!')
            $scope.show = result.show
            $rootScope.loading = false
            $scope.$apply()
        })

        $scope.downloadEpisode = (episode) => {

            let show = $scope.show.Title
            let label = episode.label
            let s = episode.s
            let e = episode.e

            console.log('Download episode:', episode)

            $scope.show.Seasons[s][e].loading = true
            $scope.$applyAsync()

            torrentService.searchTorrent({
                    show: show,
                    episode: label
                })
                .then((result) => {
                    torrentService.downloadTorrent(result, $rootScope)
                        .then((t) => {
                            $scope.show.Seasons[s][e].loading = false
                            console.log(result.episode, 'is downloading')
                        })
                })
                .catch((reason) => {
                    $scope.show[s][e].loading = false
                    console.log('No torrent was found')
                })
        }

        $scope.deleteEpisode = (showObj) => {
            let show = showObj.show
            let episode = showObj.episode
            console.log('Deleting actual folder')
            fsExtra.removeSync(process.cwd() + '/library/' + show + '/' + episode);
            console.log('Deleting from library (rootscope)')
            for (var i = 0; i < $rootScope.library.length; i++) {
                if ($rootScope.library[i].show === show && $rootScope.library[i].episode === episode) {
                    $rootScope.library.splice(i, 1)
                }
            }
            console.log('Deleting from library (localStorage)')
            localStorage.setItem('library', JSON.stringify($rootScope.library))

            start()
        }

        start()
    }
})();
