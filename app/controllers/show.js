(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, subsService, commonService, wtService) {

        $rootScope.loading = true
        $scope.show = commonService.capitalCase($stateParams.show.trim())
        $rootScope.current_show = $scope.show
        $scope.downloading = []
        console.log($scope.show)

        // $rootScope.$on('downloading', (showObj) => {
        //     console.log('downloading', showObj)
        // })

        $interval(() => {
            if ($rootScope.pending) {
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    for (var j = 0; j < $rootScope.episodes.length; j++) {
                        if ($rootScope.pending[i].show === $rootScope.episodes[j].show && $rootScope.pending[i].episode === $rootScope.episodes[j].episode) {
                            $rootScope.episodes[j].eta = commonService.formatTime($rootScope.pending[i].eta)
                        }
                    }
                }
                if (!$rootScope.$$phase) {
                    $rootScope.$apply()
                }
            }
        }, 1000)

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
                        if (d.show === $scope.show && d.episode === episodes[i].episode) {
                            episodes[i].downloaded = true
                        }
                    })
                }
                $rootScope.episodes = episodes
                console.log('Episodes ->', $rootScope.episodes)
                $rootScope.loading = false
                $scope.$apply()
            })

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
                            $scope.downloading.push(episode)
                            console.log('Download complete:', result.episode)
                        })
                })
                .catch((reason) => {
                    console.log('No torrent was found')
                })
        }


    }
})();
