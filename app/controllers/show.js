(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $sce, $scope, $interval, $timeout, $stateParams, jsonService, torrentService, subsService, commonService, wtService, dialogService) {

        let fsExtra = require('fs-extra')

        $rootScope.loading = true
        console.log('$stateParams', $stateParams)
        $scope.title = $stateParams.show ? commonService.capitalCase($stateParams.show.trim()) : $rootScope.current_show.Title
        $scope.selected_ep = $stateParams.episode
        $rootScope.current_show.Title = $scope.title
        $scope.downloading = []
        $scope.poster = 'res/posters/' + commonService.spacedToDashed($scope.title) + '.jpg'

        $rootScope.$on('show_ready', (e, showResult) => {
            sessionStorage.removeItem('current_show')
            formatDataAndSave(showResult)
            $scope.showIsLoading = false
            console.log('Show is ready')
        })

        $scope.dotClass = function(episode) {
            if (episode) {
                if (episode.downloaded) return 'green'
                if (episode.timePassed && episode.timePassed.indexOf('ago') === -1 && episode.timePassed.indexOf('Today') === -1 || episode.timePassed && episode.timePassed.indexOf('Yesterday') !== -1) return 'hidden'
            }
            return ''
        }

        $scope.stream = function(episode) {
            console.log('PLAY ->', episode)
            torrentService.searchTorrent({
                    show: $scope.title,
                    episode: episode.label
                })
                .then((t) => {
                    let streamObj = { magnet: t.magnet, path: __dirname + '/../../library/' + $scope.title + '/' + episode.label }
                    console.log('streamObj', streamObj)
                    commonService.stream(streamObj)
                })
                .catch((reason) => {
                    console.log(reason)
                    dialogService.notify({ title: 'Sorry', content: 'No results' })
                })
        }

        $scope.play = function(episode) {
            console.log('play', episode.label)
            $state.go('app.episode', ({ show: $scope.title, episode: episode.label }))
        }

        $interval(() => {
            if ($rootScope.pending && $scope.show && $scope.show.Seasons) {
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    for (var s in $scope.show.Seasons) {
                        for (var e in $scope.show.Seasons[s]) {
                            if ($rootScope.pending[i].show === $scope.show.Title &&
                                $rootScope.pending[i].episode === $scope.show.Seasons[s][e].episode) {
                                $scope.show.Seasons[s][e].eta = commonService.formatTime($rootScope.pending[i].eta)
                            }
                        }
                    }
                }
            }
            $scope.$applyAsync()
                // if (!$scope.$$phase) {
                //     $scope.$apply()
                // }
        }, 1000)

        function start() {
            // if (sessionStorage.getItem('current_show')) {
            //     let tmp = JSON.parse(sessionStorage.getItem('current_show'))
            //     if (tmp.Title === $scope.title) {
            //         console.log('Found', $scope.title, 'in memory')
            //         $scope.show = tmp
            //         $rootScope.loading = false
            //         return
            //     }
            // }
            jsonService.getShow($scope.title)
                .then((showResult) => {
                    console.log('Found', $scope.title, 'in local json')
                    $scope.show = showResult
                    $scope.show.safe_trailer_src = $sce.trustAsResourceUrl($scope.show.Trailer.replace("watch?v=", "embed/"))
                        // if ($scope.show.Overview.length > 300) $scope.show.Overview = $scope.show.Overview.substring(0, 300) + '..'
                    formatDataAndSave(showResult)
                    $rootScope.loading = false

                }).catch((errorMsg) => {
                    // console.error('Something went south..')
                })
        }

        function formatDataAndSave(showResult) {
            // console.log('formatDataAndSave', showResult)
            if (showResult) {
                for (var season in showResult.Seasons) {
                    for (var episode in showResult.Seasons[season]) {
                        var formatted_date = {}
                        formatted_date = commonService.getDayObject(showResult.Seasons[season][episode].date)
                        showResult.Seasons[season][episode].dotw = formatted_date.dotw
                        showResult.Seasons[season][episode].dotm = formatted_date.dotm
                        showResult.Seasons[season][episode].month = formatted_date.month
                        showResult.Seasons[season][episode].timePassed = commonService.timePassed(showResult.Seasons[season][episode].date)
                        JSON.parse(localStorage.getItem('library')).filter((d) => {
                            if (d.show === showResult.Title && d.episode === showResult.Seasons[season][episode].episode && !showResult.Seasons[season][episode].eta) {
                                showResult.Seasons[season][episode].downloaded = true
                            }
                        })
                    }
                }
            }
            $scope.show = showResult
            $rootScope.current_show = $scope.show
            sessionStorage.setItem('current_show', JSON.stringify($scope.show))
            $scope.selectedIndex = 0
            $scope.$applyAsync()

        }

        $scope.$on('show_overview', function(event, result) {
            console.log('Overview ready!')
            $scope.show = result.show
            $rootScope.loading = false
            $scope.showIsLoading = true
            $scope.$applyAsync()
        })

        $scope.downloadEpisode = (episode) => {
            let show = $scope.show.Title
            let label = episode.label
            let s = episode.s
            let e = episode.e
            let searchObject = {
                show: show,
                episode: label
            }
            if ($scope.show.Genres.indexOf('Talk Show') > -1) searchObject.date = episode.date

            console.log('Download episode:', episode)

            $scope.show.Seasons[s][e].loading = true
            $scope.$applyAsync()

            $rootScope.$on('episode_downloaded', (event, result)=> {
                delete $scope.show.Seasons[s][e].eta
                $rootScope.current_show = $scope.show
                sessionStorage.setItem('current_show', JSON.stringify($scope.show))
                $scope.show.Seasons[s][e].loading = false
                $scope.show.Seasons[s][e].downloaded = true
                $scope.showIsLoading = false
                console.log(result.episode, 'is ready')
                $scope.$applyAsync()

            })

            torrentService.searchTorrent(searchObject)
                .then((result) => {
                    console.log(result.episode, 'is downloading')
                    $scope.show.Seasons[s][e].loading = false
                    torrentService.downloadTorrent(result)
                })
                .catch((reason) => {
                    console.log('No torrent was found')
                    console.log($scope.show, s, e)
                    $scope.show.Seasons[s][e].loading = false
                    dialogService.torrentForm({ show: $scope.show.Title, episode: $scope.show.Seasons[s][e].episode, date: $scope.show.Seasons[s][e].date })
                        .then((dialogResult) => {
                            console.log('Dialog result ->', dialogResult)
                            torrentService.searchTorrent(dialogResult)
                                .then((result) => {
                                    console.log(result.episode, 'is downloading')
                                    $scope.show.Seasons[s][e].loading = false
                                    torrentService.downloadTorrent(result)
                                        .then((t) => {
                                            delete $scope.show.Seasons[s][e].eta
                                            $rootScope.current_show = $scope.show
                                            sessionStorage.setItem('current_show', JSON.stringify($scope.show))
                                            $scope.show.Seasons[s][e].loading = false
                                            $scope.show.Seasons[s][e].downloaded = true
                                            console.log(result.episode, 'is ready')
                                            $scope.showIsLoading = false
                                            $scope.$applyAsync()
                                        })
                                })
                        })
                        .catch(() => {
                            console.log('Dialog closed')
                        })
                })
        }

        $scope.playTrailer = () => {
            let trailer = $scope.show.Trailer
            console.log('Playing trailer:', trailer)

            dialogService.trailer({ src: $scope.show.Trailer })

        }

        $scope.deleteEpisode = (showObj) => {
            let show = $scope.title
            let episode = showObj.label
            console.log('Deleting actual folder')
            fsExtra.removeSync(__dirname + '/../../library/' + show + '/' + episode);
            console.log('Deleting from library (rootscope)')
            for (var i = 0; i < $rootScope.library.length; i++) {
                if ($rootScope.library[i].show === show && $rootScope.library[i].episode === episode) {
                    $rootScope.library.splice(i, 1)
                }
            }
            console.log('Deleting from library (localStorage)')
            localStorage.setItem('library', JSON.stringify($rootScope.library))

            start()
        }

        start()

        /////////// SEASONS TABS WRAPPER OFFSET HANDLER ///////////
        var cumulativeOffset = function(element) {
            var top = 0
            do {
                top += element.offsetTop || 0
                element = element.offsetParent
            } while (element);
            return top
        }
        let tabsWrapper = document.getElementsByTagName('md-tabs-wrapper')[0]
        let orginalOffset = cumulativeOffset(tabsWrapper)
        window.addEventListener('scroll', (e) => {
            window.requestAnimationFrame(() => {
                let wrapperOffset = cumulativeOffset(tabsWrapper)
                if (window.pageYOffset > orginalOffset - 48 && wrapperOffset) {
                    tabsWrapper.classList.add('scrolled');
                } else {
                    tabsWrapper.classList.remove('scrolled');
                }
            })
        })
        //////////////////////


    }
})();
