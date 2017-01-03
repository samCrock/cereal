(function() {
    'use strict';

    angular
        .module('app')
        .controller('episodeCtrl', episodeCtrl);

    function episodeCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, commonService, wtService) {

        const supportedVideoExt = ['mkv', 'avi', 'mp4']
        const wt_client = wtService.client()

        console.log('Episode')
        $rootScope.loading = true
        $rootScope.msg = ''
        $scope.torrent_msg = {}

        let chalk = require('chalk')
        let logUpdate = require('log-update')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let path = process.cwd() + '/library/'

        let mode = 'stream'
        let title = $scope.show = commonService.capitalCase($stateParams.show.trim())
        let episode = $scope.episode = $stateParams.episode.trim()
        let searchObj = {
            show: title,
            episode: episode
        }

        $scope.alternate = function() {
            $scope.alt = true
            document.querySelector('video').remove()
            searchObj.row = 1
            start()
        }

        $scope.back = () => {
            // Remove player
            var player = document.getElementById("player");
            player.parentNode.removeChild(player);
            $rootScope.$broadcast('backEvent')
        }


        // let stream = function(torrent) {
        //     // *********************** ON library ***********************
        //     let first = true
        //
        //     // Refresh speed label
        //     $interval(() => {
        //         if (torrent.librarySpeed && commonService.formatBytes(torrent.librarySpeed)) {
        //             $scope.torrent_msg.speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
        //             $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
        //             $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
        //         }
        //     }, 1000)
        //
        //
        //     torrent.on('done', () => {
        //         console.log(torrent, ' ready')
        //         console.log()
        //             // Add episode to local library
        //         let isNew = true
        //         let library = localStorage.getItem('library')
        //         library = JSON.parse(library)
        //         let ep = {
        //             show: t.show,
        //             episode: t.episode,
        //             dn: torrent.dn,
        //             torrent: t
        //         }
        //         library.filter((obj, i) => {
        //             if (obj.dn === torrent.dn) {
        //                 isNew = false
        //                 library[i] = ep
        //             }
        //         })
        //         if (isNew) {
        //             library.push(ep)
        //         }
        //         // Remove episode from pending
        //         let pending = $rootScope.pending
        //         for (var i = pending.length - 1; i >= 0; i--) {
        //             if (pending[i].name === torrent.name) {
        //                 pending.splice(i, 1)
        //             }
        //         }
        //         localStorage.setItem('library', JSON.stringify(library))
        //     })
        //
        //     torrent.on('download', (chunkSize) => {
        //         var output = [
        //             chalk.cyan(''),
        //             chalk.cyan('=================='),
        //             chalk.dim('              Name : ') + torrent.name,
        //             chalk.dim('        Downloaded : ') + commonService.formatBytes(torrent.donwloaded),
        //             chalk.dim('             Speed : ') + commonService.formatBytes(torrent.downloadSpeed) + '/s',
        //             chalk.dim('          Progress : ') + Math.floor(torrent.progress * 100),
        //             chalk.dim('               ETA : ') + commonService.formatTime(torrent.timeRemaining),
        //             chalk.cyan('==================')
        //         ]
        //         logUpdate(output.join('\n'))
        //
        //
        //         // Update pending in rootScope
        //         // console.log('$rootScope.pending', $rootScope.pending)
        //         let pending = $rootScope.pending
        //         for (var j = pending.length - 1; j >= 0; j--) {
        //             // console.log(pending[j]nam.e, torrent.name)
        //             if (pending[j].name === torrent.name) {
        //                 first = false
        //                 pending[j].progress = Math.floor(torrent.progress * 100)
        //                 pending[j].speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
        //             }
        //         }
        //         if (first) {
        //             $rootScope.pending.push({
        //                 show: torrent.show,
        //                 episode: torrent.episode,
        //                 name: torrent.name,
        //                 path: torrent.path,
        //                 magnet: torrent.magnet,
        //             })
        //         }
        //
        //     })
        //
        //     console.log('Stream Torrent ->', torrent)
        //     for (let i = torrent.files.length - 1; i >= 0; i--) {
        //         let name = torrent.files[i].name
        //         let ext = name.split('.')
        //         ext = ext[ext.length - 1]
        //
        //         if (supportedVideoExt.indexOf(ext) > -1) {
        //             console.log('FILE ->', torrent.path + '/' + torrent.name + '/' + name)
        //
        //             $rootScope.msg = title + ' ' + episode
        //             let videoFile = torrent.files[i]
        //
        //             // console.log('videoFile ->', videoFile)
        //
        //             videoFile.appendTo('#video_container')
        //
        //             let video = document.querySelector('video')
        //                 // video.setAttribute('autoplay', false)
        //             video.setAttribute('width', '100%')
        //             video.style.maxHeight = '100%'
        //                 // video.webkitRequestFullscreen();
        //
        //             // if (videoFile.done) {
        //             //     video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path
        //             // }
        //
        //             // ******* KEY BINDINGS & IDLE HANDLING *******
        //             var keyPressed = {}
        //             var time
        //             document.onmousemove = resetTimer
        //
        //             function resetTimer() {
        //                 video.style.cursor = 'default'
        //                 $scope.isIdle = false
        //                 clearTimeout(time)
        //                 time = setTimeout(function() {
        //                     $scope.isIdle = true
        //                     video.style.cursor = 'none'
        //                 }, 2500)
        //             }
        //
        //             document.addEventListener('keydown', function(e) {
        //                 keyPressed[e.keyCode] = true;
        //             }, false)
        //             document.addEventListener('keyup', function(e) {
        //                 keyPressed[e.keyCode] = false;
        //             }, false)
        //
        //             function loop() {
        //                 if (keyPressed[13]) {
        //                     toggleFullScreen()
        //                 } // Enter
        //                 if (keyPressed[27]) {
        //                     video.webkitExitFullscreen();
        //                 } // Esc
        //                 if (keyPressed[32]) {
        //                     togglePlay()
        //                 } // Space
        //                 if (keyPressed[17] && keyPressed[39]) {
        //                     skip(60)
        //                 } // ctrl + right = 1m >>
        //                 if (keyPressed[17] && keyPressed[37]) {
        //                     skip(-60)
        //                 } // ctrl + left = 1m <<
        //                 if (keyPressed[18] && keyPressed[39]) {
        //                     skip(10)
        //                 } // alt + right = 10s >>
        //                 if (keyPressed[18] && keyPressed[37]) {
        //                     skip(-10)
        //                 } // alt + left = 10s <<
        //                 if (keyPressed[16] && keyPressed[39]) {
        //                     skip(1)
        //                 } // shift + right = 1s >>
        //                 if (keyPressed[16] && keyPressed[37]) {
        //                     skip(-1)
        //                 } // shift + left = 1s <<
        //                 setTimeout(loop, 200)
        //             }
        //
        //             video.addEventListener('dblclick', function() {
        //                 toggleFullScreen()
        //             })
        //
        //             function toggleFullScreen() {
        //                 if (document.webkitFullscreenElement) {
        //                     video.webkitExitFullscreen();
        //                 } else {
        //                     video.webkitRequestFullscreen();
        //                 }
        //             }
        //
        //             function togglePlay() {
        //                 if (!video) return console.error('No video element')
        //                 if (video.paused) {
        //                     video.play()
        //                 } else {
        //                     video.pause()
        //                 }
        //             }
        //
        //             function skip(value) {
        //                 video.currentTime = video.currentTime + value
        //             }
        //
        //             loop()
        //                 // ************** \BINDINGS **************
        //
        //             video.addEventListener('loadedmetadata', function() {
        //                 console.log('loadedmetadata')
        //                 $rootScope.msg = ''
        //                 $scope.torrent_msg = {}
        //                 $rootScope.$apply()
        //
        //                 let track = document.createElement('track')
        //                 track.kind = 'subtitles'
        //                 track.label = 'English'
        //                 track.srclang = 'en'
        //
        //                 console.log('Subs path:', $scope.subsPath)
        //                 if ($scope.subsPath) track.src = $scope.subsPath
        //                 track.addEventListener('load', function() {
        //                     this.mode = 'showing'
        //                         // videoElement.textTracks[0].mode = 'showing' // thanks Firefox
        //                 })
        //                 this.appendChild(track)
        //             })
        //
        //             $rootScope.loading = false
        //             let refreshIntervalId = setInterval(() => {
        //                 // Refresh speed label
        //                 if (torrent.librarySpeed && commonService.formatBytes(torrent.librarySpeed)) {
        //                     $scope.torrent_msg.speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
        //                     $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
        //                     $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
        //                 }
        //                 $scope.$apply()
        //             }, 1000)
        //             break
        //         }
        //     }
        // }


        let watch = (library_element) => {

            let name = library_element.name

            console.log(library_element)

            fsExtra.readdir(library_element.path, (err, files) => {
                files.forEach(file => {
                    file = decodeURIComponent(file)
                    let ext = file.split('.')
                    ext = ext[ext.length - 1]

                    if (supportedVideoExt.indexOf(ext) > -1) {
                        console.log('FILE ->', library_element.path + '/' + file)

                        $rootScope.msg = title + ' ' + episode
                        let videoFile = library_element.path + '/' + file

                        console.log('videoFile ->', videoFile)
                            // videoFile.appendTo('#video_container')

                        let video = document.querySelector('video')
                            // video.setAttribute('autoplay', false)
                            // video.setAttribute('width', '100%')
                            // video.style.maxHeight = '100%'
                            // video.webkitRequestFullscreen();

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

                        document.addEventListener('keydown', function(e) {
                            keyPressed[e.keyCode] = true;
                        }, false)
                        document.addEventListener('keyup', function(e) {
                            keyPressed[e.keyCode] = false;
                        }, false)

                        function loop() {
                            if (keyPressed[13]) {
                                toggleFullScreen()
                            } // Enter
                            if (keyPressed[27]) {
                                video.webkitExitFullscreen();
                            } // Esc
                            if (keyPressed[32]) {
                                togglePlay()
                            } // Space
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
                            setTimeout(loop, 100)
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
                            if (!video) return console.error('No video element')
                            if (video.paused) {
                                video.play()
                            } else {
                                video.pause()
                            }
                        }

                        function skip(value) {
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
                let library = JSON.parse(localStorage.getItem('library'))
                for (var i = 0; i < library.length; i++) {
                    if (library[i].show === title && library[i].episode === episode) {
                        watch(library[i])
                    }
                }
                // torrentService.searchTorrent(searchObj)
                //     .then(function(t) {
                //         if (!t || !t.magnet) {
                //             console.log('No torrent found!')
                //             $rootScope.msg = 'No torrent found!'
                //             $rootScope.loading = false
                //             $rootScope.$apply()
                //             setTimeout(() => {
                //                 $scope.back()
                //             }, 2000)
                //         } else {
                //
                //             let downloadTorrent = function(torrent) {
                //                 // library episodes info
                //                 // jsonService.getEpisodeInfo(t).then((t) => {
                //                 //     console.log('Updating library w\\ torrent:', t)
                //                 //     jsonService.updateLibrary(t)
                //                 // }).catch(function(e) {
                //                 //     console.error('jsonService.getEpisodeInfo ->', e)
                //                 // })
                //
                //                 let refreshIntervalId = setInterval(function() {
                //                     // Refresh speed label
                //                     $scope.torrent_msg = {}
                //                     setInterval(() => {
                //                         if (torrent && torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                //                             $scope.torrent_msg.speed = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                //                             $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                //                             $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
                //                         }
                //                         $rootScope.$apply()
                //                     }, 1000)
                //                     if (torrent.progress > 0.1) {
                //                         clearInterval(refreshIntervalId)
                //                         stream(torrent)
                //                     }
                //                     $scope.$apply()
                //                 }, 1000)
                //             }
                //
                //             //********************************* Start *********************************
                //             var skip = false
                //             for (var i = 0; i < $rootScope.pending.length; i++) {
                //                 console.log($rootScope.pending[i].name, t.name)
                //                 if ($rootScope.pending[i].name === t.name) {
                //                     console.log('Already downloading', t.name)
                //                     downloadTorrent(wt_client.torrents[i])
                //                     skip = true
                //                     break
                //                 }
                //             }
                //             if (!skip) {
                //                 wt_client.add(t.magnet, {
                //                     path: path + title + '/' + episode
                //                 }, downloadTorrent)
                //             }
                //             //*************************************************************************
                //
                //         }
                //     })
                //     .catch((e) => {
                //         $rootScope.loading = false
                //         $rootScope.msg = 'I got 99 problems and connection is one'
                //         $rootScope.$apply()
                //         setTimeout(() => {
                //             $rootScope.msg = ''
                //             $scope.back()
                //         }, 3000)
                //         reject(e)
                //     })
            })
        }

        start()
    }
})();
