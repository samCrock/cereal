angular.module('App')
    .controller('favouritesCtrl', ['$scope', '$interval', function($scope, $interval) {
        console.log('Favourites')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')

        let jsonService = ioc.create('services/json-service')
        let posterService = ioc.create('services/poster-service')

        // jsonService.updateFollowingEpisodes()
        // jsonService.getLibrary()

        $scope.following = []

        fsExtra.readFile('./backend/json/following.json', (err, data) => {
            if (data) {
                data = JSON.parse(data)
                let missingPosters = []
                data.filter((show) => {
                    if (!show.poster) {
                        missingPosters.push(posterService.downloadPoster(show.title))
                    }
                    $scope.following.push(show)
                })
                $scope.$apply()
                Promise.all(missingPosters)
                    .then((results) => {
                        results.filter((f) => {
                            console.log('f---->', f)
                                // $scope.following.push(show)
                        })
                    })
            }
        })


    }])
