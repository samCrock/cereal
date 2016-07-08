angular.module('App')
    .controller('episodeCtrl', ['$scope', '$interval', '$stateParams', function($scope, $interval, $stateParams) {
        console.log('Episode')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')

        let show = $scope.show = $stateParams.show.trim()
        let episode = $scope.episode = $stateParams.episode.trim()
        console.log('$stateParams', $stateParams)

        if (show !== '') {
            posterService.getWallpaperUrl(show)
                .then((poster) => {
                    $scope.poster = poster
                    $scope.$apply()
                })
        }

    }])
