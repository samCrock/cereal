(function() {
    'use strict';

    angular
        .module('app')
        .controller('episodeCtrl', episodeCtrl);

    function episodeCtrl($rootScope, $state, $scope, $interval, $stateParams, $mdToast, jsonService, torrentService, dbService, commonService, wtService) {

        let chalk = require('chalk')
        let logUpdate = require('log-update')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let path = __dirname + '/../../library/'
        let PouchDB = require('pouchdb-browser')
        let db = new PouchDB('cereal')

        const supportedVideoExt = ['mkv', 'avi', 'mp4']
        const wt_client = wtService.client()

        let Player = videojs('player')

        $rootScope.loading = false
        $rootScope.msg = ''
        $scope.torrent_msg = {}

        let title = $scope.show = commonService.capitalCase($stateParams.show.trim())
        let dashedTitle = commonService.spacedToDashed($scope.show)
        let episode = $scope.episode = $stateParams.episode.trim()

        let epObj = {
            show: title,
            episode: episode
        }
        let video
        let e = episode.split('e')
        let s = e[0].split('s')
        s = parseInt(s[1], 10)
        e = parseInt(e[1], 10)
        console.log('Playing', epObj.show, epObj.episode)

        $scope.back = () => {
            // Save progress
            dbService.get(dashedTitle)
                .then((doc) => {
                    doc.currentEpisode = {
                        s: s,
                        e: e,
                        label: episode
                    }
                    doc.Seasons[s][e].currentTime = Player.currentTime()
                    doc.Seasons[s][e].playProgress = commonService.mapRange(Player.currentTime(), 0, Player.duration(), 0, 100)
                    Player.currentTime(doc.Seasons[s][e].currentTime)
                    dbService.put(dashedTitle, doc)
                        .then(() => {
                            console.log('Saved playProgress to', doc.Seasons[s][e].playProgress + '%')
                            videojs('player').dispose()
                            $rootScope.$broadcast('backEvent')
                        })
                })
                .catch((err) => {
                    console.log(err)
                    videojs('player').dispose()
                    $rootScope.$broadcast('backEvent')
                })
        }

        $scope.vlc = function() {
            var filePath = path + epObj.show + '/' + epObj.episode
            fsPath.find(filePath, (err, list) => {
                list.files.forEach(file => {
                    file = decodeURIComponent(file)
                    let ext = file.split('.')
                    let fileName = ext
                    ext = ext[ext.length - 1]
                    if (supportedVideoExt.indexOf(ext) > -1 && fileName.indexOf('Sample') === -1) {
                        console.log('Opening', file, ' in VLC')
                        commonService.openFile(file)
                            // $scope.back()
                        $mdToast.show($mdToast.simple().textContent('Opening ' + fileName))
                    }
                })
            })
        }

        let watch = (library_element) => {

            library_element.path = path + library_element.show + '/' + library_element.episode
            console.log(library_element)

            fsPath.find(library_element.path, (err, list) => {
                list.files.forEach(file => {
                    file = decodeURIComponent(file)
                    let ext = file.split('.')
                    ext = ext[ext.length - 1]

                    if (supportedVideoExt.indexOf(ext) > -1) {
                        console.log('FILE ->', file)
                        $rootScope.msg = title + ' ' + episode
                        startPlayer()
                    }


                    function startPlayer() {

                        videojs('player').ready(function() {
                            var Player = this

                            let videoFile = file
                                // video = document.querySelector('video')
                            videojs('player', { 'techOrder': ['html5'] })

                            Player.src({
                                    src: file,
                                    type: 'video/mp4'
                                })
                                // video.src = videoFile

                            // RESUME
                            dbService.get(dashedTitle)
                                .then((doc) => {
                                    doc.currentEpisode = {
                                        s: s,
                                        e: e,
                                        label: episode
                                    }
                                    Player.currentTime(doc.Seasons[s][e].currentTime)
                                    console.log('Resumed play @', doc.Seasons[s][e])
                                })
                                .catch((err) => {
                                    console.log(err)
                                })

                            // ******* KEY BINDINGS & IDLE HANDLING *******
                            var keyPressed = {}
                            var time
                                // document.onmousemove = resetTimer

                            function resetTimer() {
                                Player.style.cursor = 'default'
                                $scope.isIdle = false
                                clearTimeout(time)
                                time = setTimeout(function() {
                                    $scope.isIdle = true
                                    Player.style.cursor = 'none'
                                }, 2500)
                            }
                            if ($rootScope.addListeners) {
                                document.addEventListener('keydown', function(e) {
                                    keyPressed[e.keyCode] = true;
                                    if (keyPressed[32]) {
                                        togglePlay()
                                    } // Space
                                }, false)
                                document.addEventListener('keyup', function(e) {
                                    keyPressed[e.keyCode] = false;
                                }, false)
                                $rootScope.addListeners = false;
                            }

                            function loop() {
                                if (keyPressed[13]) {
                                    toggleFullScreen()
                                } // Enter
                                if (keyPressed[27]) {
                                    Player.exitFullscreen();
                                } // Esc
                                if (keyPressed[17] && keyPressed[39]) {
                                    skip(60)
                                } // ctrl + right = 1m >>
                                if (keyPressed[17] && keyPressed[37]) {
                                    skip(-60)
                                } // ctrl + left = 1m <<
                                if (keyPressed[18] && keyPressed[39]) {
                                    skip(10)
                                } // alt + right = 10s >>
                                if (keyPressed[18] && keyPressed[37]) {
                                    skip(-10)
                                } // alt + left = 10s <<
                                if (keyPressed[16] && keyPressed[39]) {
                                    skip(1)
                                } // shift + right = 1s >>
                                if (keyPressed[16] && keyPressed[37]) {
                                    skip(-1)
                                } // shift + left = 1s <<
                                setTimeout(loop, 50)
                            }

                            document.getElementById('player').addEventListener('dblclick', function() {
                                if (document.webkitFullscreenElement) {
                                    Player.exitFullscreen();
                                } else {
                                    this.webkitRequestFullscreen();
                                }
                            })

                            function skip(value) {
                                console.log('skip', value)
                                Player.currentTime(Player.currentTime() + value)
                            }

                            function togglePlay() {
                                if (Player.paused()) {
                                    Player.play()
                                } else {
                                    Player.pause()
                                }
                            }

                            loop()
                                // ************** \BINDINGS **************


                            Player.on('loadedmetadata', function() {

                                console.log('loadedmetadata')
                                $rootScope.msg = ''
                                $scope.torrent_msg = {}
                                $rootScope.$apply()

                                // let track = document.createElement('track')
                                let track = {}
                                track.kind = 'subtitles'
                                track.label = 'English'
                                track.srclang = 'en'
                                track.manualCleanup = true
                                var subs_files = fsExtra.readdirSync(library_element.path);
                                for (var i = 0; i < subs_files.length; i++) {
                                    if (subs_files[i].indexOf('.vtt') > -1) {
                                        console.log('Subs found ->', subs_files[i])
                                        track.src = library_element.path + '/' + subs_files[i]
                                        track.mode = 'showing'
                                        this.addRemoteTextTrack(track)
                                    }
                                }
                            })
                            $rootScope.loading = false
                        })
                    }

                })

            })

        }

        // Init
        watch({
            path: __dirname + '/../../library/' + title + '/' + episode + '/',
            show: title,
            episode: episode
        })
    }
})();
