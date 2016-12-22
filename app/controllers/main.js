(function() {
    'use strict';

    angular
        .module('app')
        .controller('mainCtrl', mainCtrl);

    /* @ngInject */
    function mainCtrl($scope, $interval, $state, $rootScope, $timeout, wtService, torrentService, jsonService, commonService) {

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let logUpdate = require('log-update')
        let util = require('util')

        const wt_client = wtService.client()

        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams, options) {
            $rootScope.loading = true
            if (toState.name === 'app.episode') {
                localStorage.topper = document.body.scrollTop
            }
        })

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {

            sessionStorage.setItem('prev_state', JSON.stringify({
                name: fromState.name,
                params: fromParams
            }))
            sessionStorage.setItem('curr_state', JSON.stringify({
                name: toState.name,
                params: toParams
            }))

            if (toState.name === 'app.episode') {
                $scope.isBack = true
            } else $scope.isBack = false
            if (toState.name === 'app.calendar') {
                if (localStorage.topper > 0) {
                    $timeout(() => { // wait for DOM, then restore scroll position
                        window.scrollTo(0, localStorage.topper)
                    }, 100)
                }
            }
        })


        $scope.currentNavItem = 'calendar'
        $state.go('app.calendar')


        $scope.default_poster = './res/posters/default.jpg'

        // jsonService.updateFollowingEpisodes();
        // jsonService.getLibrary();

        $rootScope.library = []
        $rootScope.pending = []
        var library = localStorage.getItem('library')
        if (!library) {
            localStorage.setItem('library', JSON.stringify([]))
        }

        if (localStorage.getItem('pending')) {
            $rootScope.pending = JSON.parse(localStorage.getItem('pending'))
            if ($rootScope.pending.length > 0) {
                console.log('Restoring pending torrents..')
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    console.log('    >', $rootScope.pending[i].name)
                    torrentService.downloadTorrent($rootScope.pending[i])
                }
            }
        }

        // Update pending downloads
        $interval(function() {
            let temp = []
            $rootScope.pending.filter( (pending, i) => {
                temp.push(pending)
                delete temp[i].speed
                delete temp[i].eta
            })
            // console.log('- Refreshed -')
            localStorage.setItem('pending', JSON.stringify(temp))
        }, 10 * 1000)



        $rootScope.reload = true
        localStorage.topper = 0
        if (!localStorage.lastUpdate) localStorage.lastUpdate = new Date()
    }

})();
