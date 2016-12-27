(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, subsService, commonService, wtService) {

        $rootScope.loading = true
        $scope.show = $stateParams.show.trim()
        $scope.downloading = []
        console.log($scope.show)

        jsonService.getEpisodes($scope.show)
            .then((episodes) => {
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

        $scope.isDownloading = (ep) => {
            $scope.downloading.filter((d) => {
                if (d === ep) return true
            })
            return false
        }

    }
})();
