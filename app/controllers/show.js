(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, subsService, commonService, wtService, messageService) {

        let fsExtra = require('fs-extra')

        $rootScope.loading = true
        $scope.show = commonService.capitalCase($stateParams.show.trim())
        $rootScope.current_show = $scope.show
        $scope.downloading = []
        console.log($scope.show)

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
                    show: $scope.show,
                    episode: episode.episode
                })
                .then((t) => {
                    let streamObj = { magnet: t.magnet, path: process.cwd() + '/library/' + $scope.show + '/' + episode.episode }
                    console.log('streamObj', streamObj)
                    commonService.stream(streamObj)
                })
                .catch((reason) => {
                    console.log(reason)
                    messageService.notify({ title: 'Sorry', content: 'I got no results' })
                })
        }

        $scope.play = function(episode) {
            if (episode.downloaded) $state.go('app.episode', ({ show: $scope.show, episode: episode.episode }))
        }

        $interval(() => {
            if ($rootScope.pending && $rootScope.episodes) {
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    for (var j = 0; j < $rootScope.episodes.length; j++) {
                        if ($rootScope.pending[i].show === $rootScope.episodes[j].show && $rootScope.pending[i].episode === $rootScope.episodes[j].episode) {
                            $rootScope.episodes[j].eta = commonService.formatTime($rootScope.pending[i].eta)
                        }
                    }
                }
                // if (!$rootScope.$$phase) {
                $rootScope.$applyAsync()
                    // }
            }
        }, 1000)

        function start() {
            jsonService.getEpisodes($scope.show)
                .then((episodes) => {
                    var formatted_date = {}
                    for (var i = 0; i < episodes.length; i++) {
                        formatted_date = commonService.getDayObject(episodes[i].date);
                        episodes[i].show = $scope.show;
                        episodes[i].dotw = formatted_date.dotw;
                        episodes[i].dotm = formatted_date.dotm;
                        episodes[i].month = formatted_date.month;
                        episodes[i].timePassed = commonService.timePassed(episodes[i].date);
                        JSON.parse(localStorage.getItem('library')).filter((d) => {
                            if (d.show === $scope.show && d.episode === episodes[i].episode && !episodes[i].eta) {
                                episodes[i].downloaded = true
                            }
                        })
                    }
                    $rootScope.episodes = episodes.reverse()
                    console.log('Episodes ->', $rootScope.episodes)
                    $rootScope.loading = false
                    $scope.$apply()
                })
        }

        $scope.downloadEpisode = (showObj) => {
            let show = showObj.show
            let episode = showObj.episode

            $rootScope.episodes[showObj.index].loading = true
            $rootScope.$applyAsync()

            torrentService.searchTorrent({
                    show: show,
                    episode: episode
                })
                .then((result) => {
                    torrentService.downloadTorrent(result, $rootScope)
                        .then((t) => {
                            $scope.downloading.push(episode)
                            $rootScope.episodes[showObj.index].loading = false
                            console.log('Download complete:', result.episode)
                        })
                })
                .catch((reason) => {
                    $rootScope.episodes[showObj.index].loading = false
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
