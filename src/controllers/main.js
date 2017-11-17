(function() {
    'use strict';

    angular
    .module('app')
    .controller('mainCtrl', mainCtrl);

    /* @ngInject */
    function mainCtrl($scope, $interval, $window, $state, $location, $anchorScroll, $rootScope, $timeout, $mdToast, wtService, torrentService, jsonService, commonService, dbService, updateService) {

        const fsExtra = require('fs-extra'),
        fsPath = require('fs-path'),
        logUpdate = require('log-update'),
        util = require('util'),
        remote = require('electron').remote

        const wt_client = wtService.client()

        // CONFIG SETUP
        $rootScope.CONFIG = {
            engines: 2, // Number of torrent engines to use before rejecting searchTorrent (3 == all)
            auto_download: false
        }
        if (localStorage.getItem('CONFIG')) {
            $rootScope.CONFIG = JSON.parse(localStorage.getItem('CONFIG'))
        }
        // console.log('[ CONFIG ]', $rootScope.CONFIG)
        $rootScope.$watch('CONFIG.auto_download', (newValue) => {
            localStorage.setItem('CONFIG', JSON.stringify($rootScope.CONFIG))
        })

        // Routing events
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, options) {
            $location.hash('bottom');
            $anchorScroll();
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

        // Downloading toast
        $rootScope.$on('downloading', (e, torrent) => {
            $mdToast.show($mdToast.simple().textContent('Downloading ' + torrent.show + ' ' + torrent.episode))
        })

        $rootScope.addListeners = true; // Related to player key events

        $rootScope.wallpaper = 'assets/cereal.jpg' // Default background

        $rootScope.library = []
        $rootScope.pending = []
        $rootScope.recent = []

        // Restore pending downloads
        if (localStorage.getItem('pending')) {
            $rootScope.pending = JSON.parse(localStorage.getItem('pending'))
            if ($rootScope.pending.length > 0) {
                console.log('Restoring pending torrents..')
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    console.log('    >', $rootScope.pending[i].name)
                    torrentService.downloadTorrent($rootScope.pending[i])
                }
            }
        } else { localStorage.setItem('pending', JSON.stringify([])) }

        // Restore recent downloads
        if (localStorage.getItem('recent')) {
            $rootScope.recent = JSON.parse(localStorage.getItem('recent'))
        } else {
            localStorage.setItem('recent', JSON.stringify([]))
        }

        // Save pending before exit
        window.onbeforeunload = function(e) {
            console.log('Saving pending downloads...')
            let temp = []
            $rootScope.pending.filter((pending, i) => {
                temp.push(pending)
                delete temp[i].speed
                delete temp[i].eta
            })
            localStorage.setItem('pending', JSON.stringify(temp))
        }

        // Restore current show
        if (sessionStorage.getItem('current_show')) {
            $rootScope.current_show = JSON.parse(sessionStorage.getItem('current_show'))
            console.log('current_show :', $rootScope.current_show.DashedTitle)
        } else {
            $rootScope.current_show = {}
        }

        // Set reload
        $rootScope.reloadCalendar = true

        // Check update
        if (remote.getGlobal('config') && remote.getGlobal('config').update) {
            let fileName = 'update.zip'
            let fs = require('fs')
            fs.readFile(fileName, (err) => {
                if (err) {
                    updateService.downloadDistro()
                    .then(() => {
                        console.log('Ready to download update')
                    })
                } else {
                    console.log('Ready to update')
                    $rootScope.update_progress = 'Update ready'
                }
            })
        }

        // INIT (calendar)
        $rootScope.currentNavItem = 'calendar'
        $state.go('app.calendar')

    }

})();
