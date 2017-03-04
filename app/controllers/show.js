(function() {
    'use strict';

    angular
        .module('app')
        .controller('showCtrl', showCtrl);

    function showCtrl($rootScope, $state, $sce, $scope, $interval, $timeout, $stateParams, jsonService, libraryService, torrentService, subsService, commonService, wtService, dialogService, dbService) {

        let fsExtra = require('fs-extra')
        let PouchDB = require('pouchdb-browser')

        let db = new PouchDB('cereal')

        $rootScope.loading = true
        console.log('$stateParams', $stateParams)
        $scope.title = $stateParams.show ? commonService.capitalCase($stateParams.show.trim()) : $rootScope.current_show.Title
        $scope.selected_ep = $stateParams.episode
        $rootScope.current_show.Title = $scope.title
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

        $scope.play = function(episode) {
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
                                $scope.show.Seasons[s][e].progress = $rootScope.pending[i].progress
                            }
                        }
                    }
                }
            }
            $scope.$applyAsync()
        }, 1000)

        function start() {
            db.get(commonService.spacedToDashed($scope.title))
                .then((doc) => {
                    formatDataAndSave(doc)
                })
                .catch(() => {
                    jsonService.getShow($scope.title)
                        .then((showResult) => {
                            formatDataAndSave(showResult)
                        })
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
                            // showResult.Seasons[season][epidsode].playProgress = 

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
            $rootScope.wallpaper = $scope.show.Wallpaper
            sessionStorage.setItem('current_show', JSON.stringify($scope.show))
            db.get(commonService.spacedToDashed($scope.show.Title))
                .then((doc) => {
                    if (doc.currentEpisode) {
                        console.log(doc.currentEpisode)
                        $scope.selectedIndex = doc.currentEpisode.s - 1
                    } else {}
                })
                .catch((err) => {
                    console.log(err)
                })
            $scope.$applyAsync()
            $rootScope.loading = false
        }

        $scope.$on('show_overview', function(event, result) {
            console.log('Overview ready')
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

            $rootScope.$on('episode_downloaded', (event, result) => {
                $rootScope.current_show = $scope.show
                sessionStorage.setItem('current_show', JSON.stringify($scope.show))
                $scope.show.Seasons[s][e].loading = false
                $scope.show.Seasons[s][e].downloaded = true
                $scope.showIsLoading = false

                db.get(commonService.spacedToDashed($scope.title))
                    .then((doc) => {
                        $scope.show._id = commonService.spacedToDashed($scope.title)
                        $scope.show._rev = doc._rev
                        db.put($scope.show)
                            .then(() => {
                                console.log(result.episode, 'is ready')
                                formatDataAndSave($scope.show)
                            })
                            .catch(() => {
                                console.error('Error updating', $scope.title)
                            })
                    })


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

            let e = episode.split('e')
            let s = e[0].split('s')
            s = parseInt(s[1], 10)
            e = parseInt(e[1], 10)
            $scope.show.Seasons[s][e].downloaded = false

            console.log('Deleting actual folder')
            fsExtra.removeSync(__dirname + '/../../library/' + show + '/' + episode);
            console.log('Deleting from library (rootscope)')
            let library = JSON.parse(localStorage.getItem('library'))
            for (var i = 0; i < library.length; i++) {
                if (library[i].show === show && library[i].episode === episode) {
                    library.splice(i, 1)
                }
            }
            console.log('Deleting from library (localStorage)')
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
                    if (window.pageYOffset > orginalOffset && wrapperOffset) {
                        tabsWrapper.classList.add('scrolled');
                    } else {
                        tabsWrapper.classList.remove('scrolled');
                    }
                })
            })
            //////////////////////


    }
})();
