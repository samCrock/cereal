(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $sce, $scope, $interval, $timeout, $stateParams, jsonService, libraryService, torrentService, subsService, commonService, wtService, dialogService, dbService) {

        let fsExtra = require('fs-extra')
        let PouchDB = require('pouchdb-browser')
        let db = new PouchDB('cereal')
        const wt_client = wtService.client()

        $rootScope.loading = true
        console.log('$stateParams', $stateParams)
        $scope.title = $stateParams.show ? commonService.capitalCase($stateParams.show.trim()) : $rootScope.current_show.Title
        $scope.selected_ep = $stateParams.episode
            // if ($rootScope.current_show) $rootScope.current_show.Title = $scope.title
        $scope.downloading = []
        $scope.poster = 'res/posters/' + commonService.spacedToDashed($scope.title) + '.jpg'

        let destroyShowListener;
        $scope.$on('$destroy', function() {
            destroyShowListener()
        })
        destroyShowListener = $rootScope.$on('show_ready', (e, showResult) => {
            sessionStorage.removeItem('current_show')
            formatDataAndSave(showResult)
            $scope.showIsLoading = false
            $rootScope.$applyAsync()
            console.log('Show is ready')
        })

        $scope.dotClass = function(episode) {
            if (episode) {
                if (episode.downloaded) return 'green'
                if (episode.timePassed &&
                    episode.timePassed.indexOf('ago') === -1 &&
                    episode.timePassed.indexOf('Today') === -1 &&
                    episode.timePassed.indexOf('Yesterday') === -1 ||
                    episode.timePassed && episode.timePassed.indexOf('NaN') !== -1)
                    return 'hidden'
            }
            return ''
        }

        $scope.timePassedCheck = function(tp) {
            var visible = true
            if (tp && tp.indexOf('NaN') !== -1) visible = false
            return visible
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

        // $scope.pauseDownload = function(episode) {
        //     console.log('PAUSE DOWNLOAD ->', episode)
        //     wt_client.get(episode.magnet).pause()
        // }

        $scope.play = function(episode) {
            let recent = localStorage.getItem('recent')
            if (recent) {
                recent = JSON.parse(recent)
                for (var i = recent.length - 1; i >= 0; i--) {
                    if (recent[i].torrent === episode.torrent) {
                        recent.splice(i, 1)
                        localStorage.setItem('recent', JSON.stringify(recent))
                    }
                }
            }
            $state.go('app.episode', ({ show: $scope.title, episode: episode.label }))
        }

        $interval(() => {
            if ($rootScope.pending && $scope.show && $scope.show.Seasons) {
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    for (var s in $scope.show.Seasons) {
                        for (var e in $scope.show.Seasons[s]) {
                            if ($rootScope.pending[i].show === $scope.show.Title && $rootScope.pending[i].episode === $scope.show.Seasons[s][e].episode) {
                                $scope.show.Seasons[s][e].eta = commonService.formatTime($rootScope.pending[i].eta)
                                if ($scope.show.Seasons[s][e].eta.indexOf('NaN') !== -1) $scope.show.Seasons[s][e].eta = ''
                                $scope.show.Seasons[s][e].progress = $rootScope.pending[i].progress
                                $scope.show.Seasons[s][e].magnet = $rootScope.pending[i].magnet
                            }
                        }
                    }
                }
            }
            $scope.$applyAsync()
        }, 1000)

        function start() {
            jsonService.getShow($scope.title)
                .then((showResult) => {
                    formatDataAndSave(showResult)
                })
        }

        function formatDataAndSave(showResult) {
            console.log('formatDataAndSave', showResult)
            if (showResult) {
                for (var season in showResult.Seasons) {
                    for (var episode in showResult.Seasons[season]) {
                        var formatted_date = {}
                        formatted_date = commonService.getDayObject(showResult.Seasons[season][episode].date)
                        showResult.Seasons[season][episode].dotw = formatted_date.dotw
                        showResult.Seasons[season][episode].dotm = formatted_date.dotm
                        showResult.Seasons[season][episode].month = formatted_date.month
                        showResult.Seasons[season][episode].timePassed = commonService.timePassed(showResult.Seasons[season][episode].date)

                        if ($rootScope.library[showResult.Title]) {
                            let episodes = $rootScope.library[showResult.Title]
                            for (var i = 0; i < episodes.length; i++) {
                                if (episodes[i].episode === showResult.Seasons[season][episode].episode && showResult.Seasons[season][episode].progress === 100) {
                                    showResult.Seasons[season][episode].downloaded = true
                                }
                            }
                        }
                    }
                }
            }
            $scope.show = showResult
            $rootScope.current_show = $scope.show
            sessionStorage.setItem('current_show', JSON.stringify($scope.show))
            $rootScope.wallpaper = $scope.show.Wallpaper
            db.get(commonService.spacedToDashed($scope.show.Title))
                .then((doc) => {
                    if (doc.currentEpisode) {
                        console.log(doc.currentEpisode)
                        $scope.selectedIndex = doc.currentEpisode.s - 1
                    }
                    $scope.show._id = doc._id
                    $scope.show._rev = doc._rev
                    db.put($scope.show)
                        .then(() => {
                            console.log($scope.show.Title, 'synced')
                        })
                        .catch((err) => {
                            console.error('Error updating', $scope.title, err)
                        })
                })
                .catch((err) => {
                    // console.log(err)
                    $scope.show._id = commonService.spacedToDashed($scope.show.Title)
                    db.put($scope.show)
                        .then(() => {
                            console.log($scope.show.Title, 'synced')
                        })
                        .catch((err) => {
                            console.error('Error updating', $scope.title, err)
                        })
                })
            $rootScope.loading = false
            $scope.$applyAsync()
        }

        $scope.$on('show_overview', function(event, result) {
            console.log('Overview ready')
            $scope.show = result.show
            $rootScope.loading = false
            $scope.showIsLoading = true
            $scope.$applyAsync()
            formatDataAndSave($scope.show)
        })

        $rootScope.$on('episode_downloaded', (event, result) => {
            console.log('ep completed result', result)
            let e = result.episode.split('e')
            let s = e[0].split('s')
            s = parseInt(s[1], 10)
            e = parseInt(e[1], 10)
            $scope.show.Seasons[s][e].downloaded = true
            $scope.show.Seasons[s][e].loading = false
            delete $scope.show.Seasons[s][e].eta
            delete $scope.show.Seasons[s][e].progress
            console.log($scope.show, result.episode, 'completed downloading')
            $scope.$applyAsync()
            db.get(commonService.spacedToDashed($scope.show.Title))
                .then((doc) => {
                    $scope.show._id = doc._id
                    $scope.show._rev = doc._rev
                    $scope.show.last_update = new Date()
                    db.put($scope.show)
                        .then(() => {
                            console.log($scope.show.Title, 'synced')
                        })
                        .catch((err) => {
                            console.error('Error updating', $scope.title, err)
                        })
                })
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

            torrentService.searchTorrent(searchObject)
                .then((result) => {
                    console.log(result.episode, 'is downloading')
                        // $scope.show.Seasons[s][e].loading = false
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
                                        // $scope.show.Seasons[s][e].loading = false
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
            let episode = showObj.episode.episode
            let magnet = showObj.episode.magnet
            let e = episode.split('e')
            let s = e[0].split('s')
            s = parseInt(s[1], 10)
            e = parseInt(e[1], 10)
            $timeout(() => {
                $scope.show.Seasons[s][e].downloaded = false
                $scope.show.Seasons[s][e].loading = false
                delete $scope.show.Seasons[s][e].eta
                delete $scope.show.Seasons[s][e].progress
            }, 1000)
            if (magnet) {
                try {
                    wt_client.remove(magnet, () => {
                        console.log('Deleted from client')
                        for (var i = 0; i < $rootScope.pending.length; i++) {
                            if ($rootScope.pending[i].magnet === magnet) {
                                $rootScope.pending.splice(i, 1)
                            }
                        }
                        let local_pending = JSON.parse(localStorage.getItem('pending'))
                        for (var i = 0; i < local_pending.length; i++) {
                            if (local_pending[i].magnet === magnet) {
                                local_pending.splice(i, 1)
                            }
                        }
                        localStorage.setItem('pending', JSON.stringify(local_pending))
                        console.log('Deleted from pending')
                    })
                } catch (err) {

                }
            }
            db.get(commonService.spacedToDashed($scope.show.Title))
                .then((doc) => {
                    doc.Seasons[s][e].downloaded = false
                    delete doc.Seasons[s][e].eta
                    delete doc.Seasons[s][e].progress
                    db.put(doc)
                        .then(() => {
                            console.log('Deleted from db')
                        })
                        .catch((err) => {
                            console.error('Error writing db', err)
                        })
                })
            $rootScope.$applyAsync()
            fsExtra.removeSync(__dirname + '/../../library/' + show + '/' + episode);
            console.log('Deleted from actual folder')
        }

        $scope.deleteShow = () => {
            dialogService.confirm({ data: $scope.show.Title })
                .then(() => {
                    $rootScope.loading = true
                    let show = $scope.title
                    db.get(commonService.spacedToDashed($scope.show.Title))
                        .then(function(doc) {
                            return db.remove(doc)
                        }).then(function(result) {
                            console.log('Deleted from db')
                        }).catch(function(err) {
                            console.log(err)
                        })
                    delete $rootScope.current_show
                    sessionStorage.removeItem('current_show')
                    $rootScope.$applyAsync()
                    fsExtra.removeSync(__dirname + '/../../library/' + show)
                    console.log('Deleted from actual folder')
                    $state.go('app.library', {}, { reload: true })
                })

        }

        // INIT
        start()

        /////////// SEASONS TABS WRAPPER OFFSET HANDLER ///////////
        // var cumulativeOffset = function(element) {
        //     var top = 0
        //     do {
        //         top += element.offsetTop || 0
        //         element = element.offsetParent
        //     } while (element);
        //     return top
        // }
        // let tabsWrapper = document.getElementsByTagName('md-tabs-wrapper')[0]
        // let orginalOffset = cumulativeOffset(tabsWrapper)
        // window.addEventListener('scroll', (e) => {
        //         window.requestAnimationFrame(() => {
        //             let wrapperOffset = cumulativeOffset(tabsWrapper)
        //             if (window.pageYOffset > orginalOffset && wrapperOffset) {
        //                 tabsWrapper.classList.add('scrolled');
        //             } else {
        //                 tabsWrapper.classList.remove('scrolled');
        //             }
        //         })
        //     })
        //////////////////////


    }
})();
