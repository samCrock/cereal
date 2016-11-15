angular.module('App')
    .controller('episodeCtrl', ['$rootScope', '$state', '$scope', '$interval', '$stateParams', function($rootScope, $state, $scope, $interval, $stateParams) {
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
        let jsonService = ioc.create('services/json-service')
        let subsService = ioc.create('services/subs-service')
        let torrentService = ioc.create('services/torrent-service')
        let commonService = ioc.create('services/common-service')
        let wtService = ioc.create('services/wt-service')
        const wt_client = wtService.client()
        let title = $scope.show = $stateParams.show.trim()
        let episode = $scope.episode = $stateParams.episode.trim()
        let searchObj = { show: title, episode: episode }
        let mode = 'stream'

        $scope.msg = {}

        let stream = function(torrent) {
            console.log('Stream Torrent ->', torrent)
            for (let i = torrent.files.length - 1; i >= 0; i--) {
                let name = torrent.files[i].name
                let ext = name.split('.')
                ext = ext[ext.length - 1]
                    // console.log('   n', i, '->', ext)
                if (supportedVideoExt.indexOf(ext) > -1) {
                    console.log('Found video ->', name)
                    $rootScope.msg = title + ' ' + episode
                    let videoFile = torrent.files[i]
                    console.log('videoFile ->', videoFile)

                    videoFile.appendTo('#video_container')
                    let video = document.querySelector('video')
                    video.setAttribute('width', '100%')
                    // video.setAttribute('height', 'auto')
                    if (torrent.progress === 1) video.src = decodeURIComponent(torrent.path) + '/' + videoFile.path

                    video.addEventListener('loadedmetadata', function() {
                        console.log('loadedmetadata')
                        $rootScope.msg = ''
                        delete $scope.msg
                        $rootScope.$apply()

                        track = document.createElement('track')
                        track.kind = 'subtitles'
                        track.label = 'English'
                        track.srclang = 'en'
                        console.log('Subs path:', $scope.subsPath)
                        if ($scope.subsPath) track.src = $scope.subsPath
                        track.addEventListener('load', function() {
                            this.mode = 'showing'
                            videoElement.textTracks[0].mode = 'showing' // thanks Firefox 
                        })
                        this.appendChild(track)
                    })

                    // Refresh speed label
                    $rootScope.loading = false
                    let refreshIntervalId = setInterval(() => {
                            if (torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                                $scope.msg.download = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                                $scope.msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                $scope.msg.progress = Math.round(torrent.progress * 100) + '%'
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
                            delete $scope.msg
                            torrent.destroy(() => {
                                console.log('Torrent destroyed!')
                            })
                        }) // console.log('video', video)
                    console.log('Current torrents ->', wt_client.torrents) // resolve()
                    break
                }
            }
        }

        return new Promise(function(resolve, reject) {
            $rootScope.msg = 'Searching for' + ' ' + title + ' ' + episode
            torrentService.searchTorrent(searchObj)
                .then(function(t) {
                    if (!t || !t.magnet) {
                        console.log('No results')
                        $rootScope.msg = 'No torrent found!'
                        $rootScope.$apply()
                        setTimeout(() => {
                            $state.go('app.calendar')
                        }, 3000)
                    } else {
                        subsService.search({ fileName: t.name, show: title, episode: episode })
                            .then((link) => {
                                console.log('link', link)
                                subsService.download(link).then((res) => {
                                    var srtData = fsExtra.readFileSync(res)
                                    srt2vtt(srtData, function(err, vttData) {
                                        if (err) throw new Error(err)
                                        $scope.subsPath = res.substring(0, res.length - 4) + '.vtt'
                                        fsExtra.writeFileSync($scope.subsPath, vttData)
                                    })
                                })
                            })

                        // Start
                        wt_client.add(t.magnet, {
                            path: path + title + '/' + episode
                        }, function(torrent) {
                            let refreshIntervalId = setInterval(function() {
                                // Refresh speed label
                                setInterval(() => {
                                    if (torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                                        $scope.msg.download = commonService.formatBytes(torrent.downloadSpeed) + '/s'
                                        $scope.msg.remaining = commonService.formatTime(torrent.timeRemaining)
                                        $scope.msg.progress = Math.round(torrent.progress * 100) + '%'
                                    }
                                    $rootScope.$apply()
                                }, 1000)
                                if (torrent.progress > 0.1) {
                                    clearInterval(refreshIntervalId)
                                    stream(torrent)
                                }
                                $scope.$apply()
                            }, 1000)
                        })
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
    }])
