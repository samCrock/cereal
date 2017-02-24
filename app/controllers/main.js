(function() {
    'use strict';

    angular
        .module('app')
        .controller('mainCtrl', mainCtrl);

    /* @ngInject */
    function mainCtrl($scope, $interval, $state, $location, $anchorScroll, $rootScope, $timeout, wtService, torrentService, jsonService, commonService, libraryService) {

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let logUpdate = require('log-update')
        let util = require('util')
        const wt_client = wtService.client()


        // CONFIG SETUP
        $rootScope.CONFIG = {
            engines: 1, // Number of torrent engines to use before rejecting searchTorrent (3 == all)
            auto_download: false
        }
        if (localStorage.getItem('CONFIG')) {
            $rootScope.CONFIG = JSON.parse(localStorage.getItem('CONFIG'))
        }
        console.log('[ CONFIG ]', $rootScope.CONFIG)
        $rootScope.$watch('CONFIG.auto_download', (newValue) => {
            localStorage.setItem('CONFIG', JSON.stringify($rootScope.CONFIG))
        })


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


        $state.go('app.calendar')
        $rootScope.currentNavItem = 'calendar'

        $rootScope.addListeners = true; // Related to player key events

        $scope.default_poster = './assets/posters/default.jpg'

        // jsonService.updateFollowingEpisodes();
        // jsonService.getLibrary();

        $rootScope.library = []
        $rootScope.pending = []
        var library = localStorage.getItem('library')
        if (!library) {
            // localStorage.setItem('library', JSON.stringify([]))
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

        // Remove from pending
        $interval(() => {
            for (var i = 0; i < $rootScope.pending.length; i++) {
                if ($rootScope.pending[i].progress === 100) {
                    console.log('Removing', $rootScope.pending[i].show, $rootScope.pending[i].episode, 'from pending downloads')
                    $rootScope.pending.splice(i, 1)
                }
            }
            localStorage.setItem('pending', JSON.stringify($rootScope.pending))
            if (!$rootScope.$$phase) {
                $rootScope.$apply()
            }
        }, 1000)


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
            $rootScope.current_show = JSON.parse(sessionStorage.getItem('current_show'))
            console.log('current_show :', $rootScope.current_show.Title)
        } else {
            $rootScope.current_show = {}
        }

        $rootScope.reload = true
            // localStorage.topper = 0
        if (!localStorage.lastUpdate) localStorage.lastUpdate = new Date()

        // var library = []
        // var episodes = []

        if (!fsExtra.existsSync(__dirname + '/../../library')) {
            fsExtra.mkdirSync(__dirname + '/../../library');
        }
        var shows = fsExtra.readdirSync(__dirname + '/../../library')

        libraryService.getLibrary().then((library) => {
            $rootScope.library = library
            console.log('Library', library)
        })

        // var pending = JSON.parse(localStorage.getItem('pending'))
        // var isPending

        // for (var i = 0; i < shows.length; i++) {
        //     episodes = fsExtra.readdirSync(__dirname + '/../../library/' + shows[i])
        //     for (var j = 0; j < episodes.length; j++) {
        //         // console.log(shows[i], episodes[j])
        //         isPending = false
        //         for (var k = 0; k < pending.length; k++) {
        //             if (pending[k].show === shows[i] && pending[k].episode === episodes[j]) {
        //                 isPending = true
        //             }
        //         }
        //         if (!isPending) {
        //             library.push({
        //                 show: shows[i],
        //                 episode: episodes[j],
        //                 poster: __dirname + '/../../assets/posters/' + commonService.spacedToDashed(shows[i]) + '.jpg'
        //             })
        //         }
        //     }
        // }
        localStorage.setItem('library', JSON.stringify(library))
        $rootScope.library = library


        $rootScope.wallpaper = __dirname + '/../../assets/bkg/city.jpg'
    }

})();
