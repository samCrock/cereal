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

            var state = toState.name.split('.')
            $rootScope.currentNavItem = state[1]
        })

        $rootScope.$on('backEvent', (e) => {
            console.log('backEvent catched', e)
            $rootScope.msg = ''
            $scope.torrent_msg = {}
            let prev_state = sessionStorage.getItem('prev_state')
            prev_state = JSON.parse(prev_state)
            $state.go(prev_state.name, prev_state.params)
        })


        $state.go('app.calendar')
        $rootScope.currentNavItem = 'calendar'


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
        } else {
            localStorage.setItem('pending', JSON.stringify([]))
        }


        let save_pending = () => {
            console.log('Saving pending downloads...')
            let temp = []
            $rootScope.pending.filter((pending, i) => {
                temp.push(pending)
                delete temp[i].speed
                delete temp[i].eta
            })
            localStorage.setItem('pending', JSON.stringify(temp))
        }

        // Update pending downloads every 30mins
        // $interval(save_pending(), 30 * 60 * 1000)

        // Catch exit event
        window.onbeforeunload = function(e) {
            console.log('Saving pending downloads...')
            let temp = []
            $rootScope.pending.filter((pending, i) => {
                temp.push(pending)
                delete temp[i].speed
                delete temp[i].eta
            })
            localStorage.setItem('pending', JSON.stringify(temp))
                // return true
        }

        // INIT show page
        if (sessionStorage.getItem('current_show')) {
            $rootScope.current_show = sessionStorage.getItem('current_show')
        }

        $rootScope.reload = true
        localStorage.topper = 0
        if (!localStorage.lastUpdate) localStorage.lastUpdate = new Date()
    }

})();
