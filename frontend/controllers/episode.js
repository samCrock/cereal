angular.module('App')
    .controller('episodeCtrl', ['$rootScope', '$state', '$scope', '$interval', '$stateParams',
        function($rootScope, $state, $scope, $interval, $stateParams) {

            const supportedVideoExt = ['mkv', 'avi', 'mp4']
            console.log('Episode')
            $rootScope.loading = false
            delete $rootScope.msg

            let ioc = require('../../ioc')
            let fsExtra = require('fs-extra')
            let fsPath = require('fs-path')
            let srt2vtt = require('srt2vtt')

            // let WebTorrent = require('webtorrent')

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

            return new Promise(function(resolve, reject) {
                $rootScope.msg = 'Searching for' + ' ' + title + ' ' + episode

                torrentService.searchTorrent(searchObj)
                    .then(function(t) {
                        if (!t || !t.magnet) {
                            console.log('No results')
                            // let container = document.getElementById('video_container')
                            // container.removeChild(container.childNodes[0])
                            $rootScope.msg = 'No torrent found!'
                            $rootScope.$apply()
                            setTimeout(() => {
                                $state.go('app.calendar')
                            }, 3000)
                        } else {
                            console.log('t', t.magnet)
                            subsService.search({ fileName: t.name, show: title, episode: episode })
                                .then((link) => {
                                    console.log('link', link)
                                    subsService.download(link)
                                        .then((res) => {
                                            var srtData = fsExtra.readFileSync(res)
                                            srt2vtt(srtData, function(err, vttData) {
                                                if (err) throw new Error(err)
                                                $scope.subsPath = res.substring(0, res.length - 4) + '.vtt'
                                                fsExtra.writeFileSync($scope.subsPath, vttData)
                                            })
                                        })
                                })
                            wt_client.add(t.magnet, {
                                    path: path + title + '/' + episode
                                },
                                function(torrent) {
                                    console.log('Torrent ->', t.name)
                                    for (let i = torrent.files.length - 1; i >= 0; i--) {
                                        let name = torrent.files[i].name
                                        let ext = name.split('.')
                                        ext = ext[ext.length - 1]
                                        // console.log('   n', i, '->', ext)
                                        if (supportedVideoExt.indexOf(ext) > -1) {
                                            console.log('Found video ->', name)
                                            $rootScope.msg = 'Preparing ' + name + ' for streaming'
                                            let video = torrent.files[i]
                                            $scope.video_url = torrent.files[i].path
                                            $scope.video_ext = ext
                                            // console.log('video', video)
                                            video.appendTo('#video_container')
                                            let videoElement = document.getElementsByTagName('video')
                                            videoElement = videoElement[0]
                                            videoElement.className += 'video_player'
                                            videoElement.addEventListener('loadedmetadata', function() {

                                                $rootScope.msg = ''
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
                                            setInterval(() => {
                                                if (torrent.downloadSpeed && commonService.formatBytes(torrent.downloadSpeed)) {
                                                    $rootScope.msg = 'Speed : ' + commonService.formatBytes(torrent.downloadSpeed) + '/s' + '\nRemaining : ' + commonService.formatTime(torrent.timeRemaining)
                                                }
                                                $rootScope.$apply()
                                            }, 2000);

                                            // Catch back event to delete torrent
                                            $rootScope.$on('backToCalendar', (e) => {
                                                console.log('backToCalendar catched', e)
                                                torrent.destroy(() => {
                                                    console.log('Torrent destroyed!')
                                                })
                                            })

                                            // console.log('video', video)
                                            console.log('Current torrents ->', wt_client.torrents)

                                            // resolve()
                                        }
                                    }
                                })
                        }
                    })
                    .catch((e) => {
                        reject(e)
                    })
            })

            // // Start streaming (vlc)
            // torrentService.streamEpisode({ show: title, episode: episode }, $rootScope)
            //     .then((res) => {
            //         console.log(res);
            //         res.stdout.on('data', function(data) {
            //             console.log('data', data)
            //         });
            //         res.on('close', function(code) {
            //             console.log('close')
            //         });
            //         res.on('exit', function(code) {
            //             console.log('exit')
            //         });
            //     })
            //     .catch((msg) => {
            //         $rootScope.msg = msg
            //         setTimeout(() => {
            //             $rootScope.msg = ''
            //             $state.go('app.calendar')
            //         }, 3000)
            //     })

        }
    ])
