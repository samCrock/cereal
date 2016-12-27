(function() {
    'use strict';

    angular
        .module('app')
        .controller('episodeCtrl', episodeCtrl);

    function episodeCtrl($rootScope, $state, $scope, $interval, $stateParams, jsonService, torrentService, subsService, commonService, wtService) {
        const supportedVideoExt = ['mkv', 'avi', 'mp4']
        console.log('Episode')
        $rootScope.loading = true
        delete $rootScope.msg

        let chalk = require('chalk')
        let logUpdate = require('log-update')

        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let srt2vtt = require('srt2vtt')
        let path = process.cwd() + '/library/'
        const wt_client = wtService.client()
        let title = $scope.show = $stateParams.show.trim()
        let episode = $scope.episode = $stateParams.episode.trim()
        let searchObj = { show: title, episode: episode }
        let mode = 'stream'
        $scope.torrent_msg = {}

        $scope.alternate = function() {
            $scope.alt = true
            document.querySelector('video').remove()
            searchObj.row = 1
            watch()
        }

        $scope.back = () => {
            if ($state.includes('app.episode')) {
                let container = document.getElementById('video_container')
                container.removeChild(container.childNodes[0])
                $rootScope.$broadcast('backEvent')

                let prev_state = sessionStorage.getItem('prev_state')
                prev_state = JSON.parse(prev_state)
                $state.go(prev_state.name, prev_state.params)

            }
        }


        let stream = function(torrent) {
            // *********************** ON library ***********************
            let first = true

            // Refresh speed label
            $interval(() => {
                if (torrent.librarySpeed && commonService.formatBytes(torrent.librarySpeed)) {
                    $scope.torrent_msg.speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
                    $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                    $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
                }
            }, 1000)


            torrent.on('done', () => {
                console.log(torrent, ' ready')
                console.log()
                    // Add episode to local library
                let isNew = true
                let library = localStorage.getItem('library')
                library = JSON.parse(library)
                let ep = {
                    show: t.show,
                    episode: t.episode,
                    dn: torrent.dn,
                    torrent: t
                }
                library.filter((obj, i) => {
                    if (obj.dn === torrent.dn) {
                        isNew = false
                        library[i] = ep
                    }
                })
                if (isNew) { library.push(ep) }
                // Remove episode from pending librarys
                let pending = $rootScope.pending
                for (var i = pending.length - 1; i >= 0; i--) {
                    if (pending[i].name === torrent.name) {
                        pending.splice(i, 1)
                    }
                }
                localStorage.setItem('library', JSON.stringify(library))
            })

            torrent.on('library', (chunkSize) => {
                var output = [
                    chalk.cyan(''),
                    chalk.cyan('=================='),
                    chalk.dim('              Name : ') + torrent.name,
                    chalk.dim('        libraryed : ') + commonService.formatBytes(torrent.libraryed),
                    chalk.dim('             Speed : ') + commonService.formatBytes(torrent.librarySpeed) + '/s',
                    chalk.dim('          Progress : ') + Math.floor(torrent.progress * 100),
                    chalk.dim('         Remaining : ') + commonService.formatTime(torrent.timeRemaining),
                    chalk.cyan('==================')
                ]
                logUpdate(output.join('\n'))


                // Update pending in rootScope
                // console.log('$rootScope.pending', $rootScope.pending)
                let pending = $rootScope.pending
                for (var j = pending.length - 1; j >= 0; j--) {
                    // console.log(pending[j]nam.e, torrent.name)
                    if (pending[j].name === torrent.name) {
                        first = false
                        pending[j].progress = Math.floor(torrent.progress * 100)
                        pending[j].speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
                    }
                }
                if (first) {
                    $rootScope.pending.push({
                        show: torrent.show,
                        episode: torrent.episode,
                        name: torrent.name,
                        path: torrent.path,
                        magnet: torrent.magnet,
                    })
                }

            })


            console.log('Stream Torrent ->', torrent)


            for (let i = torrent.files.length - 1; i >= 0; i--) {
                let name = torrent.files[i].name
                let ext = name.split('.')
                ext = ext[ext.length - 1]

                if (supportedVideoExt.indexOf(ext) > -1) {
                    console.log('FILE ->', torrent.path + '/' + torrent.name + '/' + name)

                    $rootScope.msg = title + ' ' + episode
                    let videoFile = torrent.files[i]

                    // console.log('videoFile ->', videoFile)

                    videoFile.appendTo('#video_container')

                    let video = document.querySelector('video')
                        // video.setAttribute('autoplay', false)
                    video.setAttribute('width', '100%')
                    video.style.maxHeight = '100%'
                        // video.webkitRequestFullscreen();

                    if (videoFile.done) {
                        video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path
                    }

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
                        if (keyPressed[13]) { toggleFullScreen() } // Enter
                        if (keyPressed[27]) { video.webkitExitFullscreen(); } // Esc
                        if (keyPressed[32]) { togglePlay() } // Space
                        if (keyPressed[17] && keyPressed[39]) { skip(60) } // ctrl + right = 1m >>
                        if (keyPressed[17] && keyPressed[37]) { skip(-60) } // ctrl + left = 1m <<
                        if (keyPressed[18] && keyPressed[39]) { skip(10) } // alt + right = 10s >>
                        if (keyPressed[18] && keyPressed[37]) { skip(-10) } // alt + left = 10s <<
                        if (keyPressed[16] && keyPressed[39]) { skip(1) } // shift + right = 1s >>
                        if (keyPressed[16] && keyPressed[37]) { skip(-1) } // shift + left = 1s <<
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
                        if (video.paused) { video.play() } else { video.pause() }
                    }

                    function skip(value) {
                        video.currentTime = video.currentTime + value
                    }

                    loop()
                        // ************** /BINDINGS **************

                    video.addEventListener('loadedmetadata', function() {
                        console.log('loadedmetadata')
                        $rootScope.msg = ''
                        $scope.torrent_msg = {}
                        $rootScope.$apply()

                        let track = document.createElement('track')
                        track.kind = 'subtitles'
                        track.label = 'English'
                        track.srclang = 'en'
                        console.log('Subs path:', $scope.subsPath)
                        if ($scope.subsPath) track.src = $scope.subsPath
                        track.addEventListener('load', function() {
                            this.mode = 'showing'
                                // videoElement.textTracks[0].mode = 'showing' // thanks Firefox
                        })
                        this.appendChild(track)
                    })

                    $rootScope.loading = false
                    let refreshIntervalId = setInterval(() => {
                            // Refresh speed label
                            if (torrent.librarySpeed && commonService.formatBytes(torrent.librarySpeed)) {
                                $scope.torrent_msg.speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
                                $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
                            }
                            $scope.$apply()
                                // if (torrent.progress === 1) {
                                //     video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path
                                //     clearInterval(refreshIntervalId)
                                // }
                        }, 1000)
                        // Catch back event to delete torrent
                    $rootScope.$on('backEvent', (e) => {
                            console.log('backEvent catched', e)
                            $rootScope.msg = ''
                            $scope.torrent_msg = {}
                            torrent.destroy(() => {
                                console.log('Torrent destroyed!')
                            })
                        }) // console.log('video', video)
                    break
                }
            }
        }

        let watch = function() {
            return new Promise(function(resolve, reject) {
                $rootScope.msg = 'Searching for' + ' ' + title + ' ' + episode
                torrentService.searchTorrent(searchObj)
                    .then(function(t) {
                        if (!t || !t.magnet) {
                            console.log('No results')
                            $rootScope.loading = false
                            $rootScope.msg = 'No torrent found!'
                            $rootScope.$apply()
                            setTimeout(() => {
                                $state.go('app.calendar')
                            }, 2500)
                        } else {
                            subsService.search({ fileName: t.name, show: title, episode: episode })
                                .then((link) => {
                                    console.log('Subs search result:', link)
                                    if (link) {
                                        subsService.library(link).then((res) => {
                                            console.log('Subservice result:', res)
                                            var srtData = fsExtra.readFileSync(res)
                                            srt2vtt(srtData, function(err, vttData) {
                                                if (err) throw new Error('Error converting subs:', err)
                                                $scope.subsPath = res.substring(0, res.length - 4) + '.vtt'
                                                fsExtra.writeFileSync($scope.subsPath, vttData)
                                            })
                                        })
                                    }
                                })

                            let downloadTorrent = function(torrent) {
                                // library episodes info
                                jsonService.getEpisodeInfo(t).then((t) => {
                                    console.log('Updating library w\\ torrent:', t)
                                    jsonService.updateLibrary(t)
                                }).catch(function(e) {
                                    console.error('jsonService.getEpisodeInfo ->', e)
                                })

                                let refreshIntervalId = setInterval(function() {
                                    // Refresh speed label
                                    $scope.torrent_msg = {}
                                    setInterval(() => {
                                        if (torrent && torrent.librarySpeed && commonService.formatBytes(torrent.librarySpeed)) {
                                            $scope.torrent_msg.speed = commonService.formatBytes(torrent.librarySpeed) + '/s'
                                            $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                            $scope.torrent_msg.progress = Math.round(torrent.progress * 100)
                                        }
                                        $rootScope.$apply()
                                    }, 1000)
                                    if (torrent.progress > 0.1) {
                                        clearInterval(refreshIntervalId)
                                        stream(torrent)
                                    }
                                    $scope.$apply()
                                }, 1000)
                            }

                            //********************************* Start *********************************
                            var skip = false
                            for (var i = 0; i < wt_client.torrents.length; i++) {
                                if (wt_client.torrents[i].ready || wt_client.torrents[i].dn === t.name) {
                                    console.log('Already downloading', t.name)
                                    downloadTorrent(wt_client.torrents[i])
                                    skip = true
                                    break
                                }
                            }
                            if (!skip) {
                                wt_client.add(t.magnet, {
                                    path: path + title + '/' + episode
                                }, downloadTorrent)
                            }
                            //*************************************************************************

                        }
                    })
                    .catch((e) => {
                        $rootScope.loading = false
                        $rootScope.msg = 'I got 99 problems and connection is one'
                        $rootScope.$apply()
                        setTimeout(() => {
                            $state.go('app.calendar')
                        }, 3000)
                        reject(e)
                    })
            })
        }

        watch()
    }
})();
