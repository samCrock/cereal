angular.module('App')
    .controller('mainCtrl', ['$scope', '$interval', function($scope, $interval) {

        let ioc = require('../../ioc')

        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')
        // Called in search form
        $scope.search = () => {
            $scope.search_loading = true
            if ($scope.search.season.length === 1) $scope.search.season = '0' + $scope.search.season
            if ($scope.search.episode.length === 1) $scope.search.episode = '0' + $scope.search.episode
            torrentService.searchTorrent({
                show: $scope.search.show,
                episode: 'S' + $scope.search.season + 'E' + $scope.search.episode
            }).then((torrent) => {
                console.log('Torrent found:', torrent)
                torrent.show = commonService.getShowTitleFromTorrent(torrent)
                $scope.locals.push(torrent)
                $scope.search_loading = false
                $scope.$apply()
                torrentService.downloadTorrent(torrent, $scope).then(() => {
                    console.log('Done')
                })
            })
        }

    }])
