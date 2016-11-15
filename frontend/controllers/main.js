'use strict'
angular.module('App')
    .controller('mainCtrl', ['$scope', '$interval', '$state', '$rootScope', '$timeout', function($scope, $interval, $state, $rootScope, $timeout) {
        let ioc = require('../../ioc')

        let commonService = ioc.create('services/common-service')
        let torrentService = ioc.create('services/torrent-service')

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let logUpdate = require('log-update')
        let util = require('util')

        let jsonService = ioc.create('services/json-service')
        let wtService = ioc.create('services/wt-service')

        const wt_client = wtService.client()

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
            $rootScope.loading = true
            if (toState.name === 'app.episode') {
                localStorage.topper = document.body.scrollTop
            }
        })

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {
            if (toState.name === 'app.episode') {
                $scope.isBack = true
            } else $scope.isBack = false
            if (toState.name === 'app.calendar') {
                if (localStorage.topper > 0) {
                    $timeout(() => { // wait for DOM, then restore scroll position
                        window.scrollTo(0, localStorage.topper)
                    }, 0)
                }
            }
        })


        $scope.currentNavItem = 'calendar'
        $state.go('app.calendar')

        $scope.back = () => {
            if ($state.includes('app.episode')) {
                let container = document.getElementById('video_container')
                container.removeChild(container.childNodes[0])
                $rootScope.$broadcast('backToCalendar')
                $state.go('app.calendar')
            }
        }

        $scope.search = () => {
            $scope.search_loading = true;
            if ($scope.search.season.length === 1) { $scope.search.season = '0' + $scope.search.season; }
            if ($scope.search.episode.length === 1) { $scope.search.episode = '0' + $scope.search.episode; }
            torrentService.searchTorrent({
                show: $scope.search.show,
                episode: 'S' + $scope.search.season + 'E' + $scope.search.episode
            }).then((torrent) => {
                console.log('Torrent found:', torrent)
                torrent.show = commonService.getShowTitleFromTorrent(torrent)
                $rootScope.locals.push(torrent)
                $scope.search_loading = false
                $scope.$apply()
                torrentService.downloadTorrent(torrent, $scope).then(() => {
                    console.log('Done')
                })
            })
        }


        $scope.default_poster = './res/posters/default.jpg'

        // jsonService.updateFollowingEpisodes();
        // jsonService.getLibrary();

        $rootScope.locals = []

        jsonService.getLibrary().then((library) => {
            console.log('Library --->', library)
        })


        $rootScope.reload = true
        localStorage.topper = 0

        if (!localStorage.lastUpdate) localStorage.lastUpdate = new Date()

    }])
