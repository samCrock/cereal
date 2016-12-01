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
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let srt2vtt = require('srt2vtt') // let WebTorrent = require('webtorrent')
            // const wt_client = new WebTorrent()
        let path = process.cwd() + '/download/'
        const wt_client = wtService.client()
        let title = $scope.show = $stateParams.show.trim()
        let episode = $scope.episode = $stateParams.episode.trim()
        let searchObj = { show: title, episode: episode }
        let mode = 'stream'
        let isPresent = false
        $scope.torrent_msg = {}

        $scope.alternate = function() {
            $scope.alt = true
            document.querySelector('video').remove()
            searchObj.row = 1
            watch()
        }

        let stream = function(torrent) {
            console.log('Stream Torrent ->', torrent)
            for (let i = torrent.files.length - 1; i >= 0; i--) {
                let name = torrent.files[i].name
                let ext = name.split('.')
                ext = ext[ext.length - 1]

                if (supportedVideoExt.indexOf(ext) > -1) {
                    console.log('Found video ->', name)
                    $rootScope.msg = title + ' ' + episode
                    let videoFile = torrent.files[i]
                    console.log('videoFile ->', videoFile)

                    // if (videoFile.done) {}
                    videoFile.appendTo('#video_container')

                    let video = document.querySelector('video')
                    video.setAttribute('autoplay', false)
                    video.setAttribute('width', '100%')
                    video.style.maxHeight = '100%'
                        // if (torrent.progress === 1) video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path

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

                    // Refresh speed label
                    $rootScope.loading = false
                    let refreshIntervalId = setInterval(() => {
                            if (torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                                $scope.torrent_msg.speed = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                                $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                $scope.torrent_msg.progress = Math.round(torrent.progress * 100) + '%'
                            }
                            $scope.$apply()
                            if (torrent.progress === 1) {
                                video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path
                                clearInterval(refreshIntervalId)
                            }
                        }, 1000)
                        // Catch back event to delete torrent
                    $rootScope.$on('backToCalendar', (e) => {
                            console.log('backToCalendar catched', e)
                            $rootScope.msg = ''
                            $scope.torrent_msg = {}
                            torrent.destroy(() => {
                                console.log('Torrent destroyed!')
                            })
                        }) // console.log('video', video)
                    console.log('Current torrents ->', wt_client.torrents) // resolve()
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
                            console.log(wt_client.torrents)
                            wt_client.torrents.forEach((current_torrent) => {
                                if (current_torrent.magnetURI === t.magnet) {
                                    isPresent = true
                                }
                            })
                            subsService.search({ fileName: t.name, show: title, episode: episode })
                                .then((link) => {
                                    console.log('Subs search result:', link)
                                    if (link) {
                                        subsService.download(link).then((res) => {
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

                                // Download episodes info
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
                                        if (torrent && torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                                            $scope.torrent_msg.speed = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                                            $scope.torrent_msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                            $scope.torrent_msg.progress = Math.round(torrent.progress * 100) + '%'
                                        }
                                        $rootScope.$apply()
                                    }, 1000)
                                    if (torrent.progress > 0.01) {
                                        clearInterval(refreshIntervalId)
                                        stream(torrent)
                                    }
                                    $scope.$apply()
                                }, 1000)
                            }

                            //********************************* Start *********************************
                            var skip = false
                            console.log('Alternate', searchObj.row);
                            for (var i = 0; i < wt_client.torrents.length; i++) {
                                if (wt_client.torrents[i].magnet === t.magnetURI && searchObj.row === 0) {
                                    downloadTorrent(wt_client.torrents[i])
                                    skip = true
                                    break;
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
