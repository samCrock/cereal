angular.module('App')
    .controller('episodeCtrl', ['$rootScope', '$scope', '$interval', '$stateParams', function($rootScope, $scope, $interval, $stateParams) {
        console.log('Episode')
        $rootScope.loading = false
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')
        let torrentService = ioc.create('services/torrent-service')

        let title = $scope.show = $stateParams.show.trim()
        let episode = $scope.episode = $stateParams.episode.trim()
        console.log('$stateParams', $stateParams)

        // Start streaming
        torrentService.streamEpisode({ show: title, episode: episode })

        if (title !== '') {
            posterService.getWallpaperUrl(title)
                .then((poster) => {
                    $scope.poster = poster
                    $scope.$apply()
                })
        }

    }])
