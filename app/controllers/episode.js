(function() {
    'use strict';

    angular
        .module('app')
        .controller('episodeCtrl', episodeCtrl);

    function episodeCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, libraryService, torrentService, commonService, wtService) {

        const supportedVideoExt = ['mkv', 'avi', 'mp4']
        const wt_client = wtService.client()

        console.log('Episode')
        $rootScope.loading = false
        $rootScope.msg = ''
        $scope.torrent_msg = {}

        let chalk = require('chalk')
        let logUpdate = require('log-update')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let path = __dirname + '/../../library/'

        let mode = 'stream'
        let title = $scope.show = commonService.capitalCase($stateParams.show.trim())
        $scope.show = $scope.show.toUpperCase()
        let episode = $scope.episode = $stateParams.episode.trim()
        let searchObj = {
            show: title,
            episode: episode
        }

        console.log('Playing', searchObj.show, searchObj.episode)

        $scope.vlc = function() {
            var filePath = path + searchObj.show + '/' + searchObj.episode
            fsPath.find(filePath, (err, list) => {
                list.files.forEach(file => {
                    file = decodeURIComponent(file)
                    let ext = file.split('.')
                    let fileName = ext
                    ext = ext[ext.length - 1]
                    if (supportedVideoExt.indexOf(ext) > -1 && fileName.indexOf('Sample') === -1) {
                        console.log('Opening', file, ' in VLC')
                        commonService.openFile(file)
                        $scope.back()
                    }
                })
            })
        }

        $scope.back = () => {
            $rootScope.$broadcast('backEvent')
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

                        let videoFile = file
                        let video = document.querySelector('video')

                        video.src = videoFile

                        // ******* KEY BINDINGS & IDLE HANDLING *******
                        var keyPressed = {}
                        var time
                        document.onmousemove = resetTimer

                        function resetTimer() {
                            video.style.cursor = 'default'
                            $scope.isIdle = false
                            clearTimeout(time)
                            time = setTimeout(function() {
                                $scope.isIdle = true
                                video.style.cursor = 'none'
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
                                video.webkitExitFullscreen();
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

                        video.addEventListener('dblclick', function() {
                            toggleFullScreen()
                        })

                        function toggleFullScreen() {
                            if (document.webkitFullscreenElement) {
                                video.webkitExitFullscreen();
                            } else {
                                video.webkitRequestFullscreen();
                            }
                        }

                        function togglePlay() {
                            let video = document.querySelector('video')
                            if (!video) return
                            if (video.paused) {
                                video.play()
                            } else {
                                video.pause()
                            }
                        }

                        function skip(value) {
                            console.log('skip', value)
                            video.currentTime = video.currentTime + value
                        }

                        loop()
                            // ************** \BINDINGS **************


                        video.addEventListener('loadedmetadata', function() {

                            console.log('loadedmetadata')
                            $rootScope.msg = ''
                            $scope.torrent_msg = {}
                            $rootScope.$apply()

                            let track = document.createElement('track')
                            track.kind = 'subtitles'
                            track.label = 'English'
                            track.srclang = 'en'
                            var subs_files = fsExtra.readdirSync(library_element.path);
                            for (var i = 0; i < subs_files.length; i++) {
                                if (subs_files[i].indexOf('.vtt') > -1) {
                                    console.log('Subs found ->', subs_files[i])
                                    track.src = library_element.path + '/' + subs_files[i]
                                    track.addEventListener('load', function() {
                                        this.mode = 'showing'
                                    })
                                    track.mode = 'showing'
                                    this.appendChild(track)
                                }
                            }
                        })
                        $rootScope.loading = false
                    }
                })

            })

        }


        let start = function() {
            return new Promise(function(resolve, reject) {
                $rootScope.msg = 'Searching for' + ' ' + title + ' ' + episode
                let libraryObj = {
                    path: __dirname + '/../../library/' + title + '/' + episode + '/',
                    show: title,
                    episode: episode
                }
                watch(libraryObj)
            })
        }

        // Init
        start()
    }
})();
