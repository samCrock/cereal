(function() {
    'use strict';

    angular
        .module('app')
        .controller('pendingCtrl', pendingCtrl);

    function pendingCtrl($rootScope, $state, $scope, $interval, wtService) {

        $rootScope.loading = false
        const wt_client = wtService.client()

        $interval(() => {
            if(!$rootScope.$$phase) {
                $rootScope.$apply()
            }
        }, 1000)

        $scope.remove = (torrent) => {
            console.log(torrent);
            wt_client.remove(torrent.magnet, () => {
                console.log('Deleted')
                for (var i = 0; i < $rootScope.pending.length; i++) {
                    if ($rootScope.pending[i].magnet === torrent.magnet) {
                        $rootScope.pending.splice(i, 1)
                    }
                }
                let local_pending = JSON.parse(localStorage.getItem('pending'))
                for (var i = 0; i < local_pending.length; i++) {
                    if (local_pending[i].magnet === torrent.magnet) {
                        local_pending.splice(i, 1)
                    }
                }
                localStorage.setItem('pending', JSON.stringify(local_pending))
            })
        }

        // Catch completed event from torrentService
        $rootScope.$on('completed', function ($event, torrent) {
            console.log('Completed event catched')
            for (var i = 0; i < wtClient.torrents.length; i++) {
                if (wtClient.torrents[i].magnet === torrent.magnet) {
                    wt_client.remove(torrent.magnet, () => {
                        console.log('Deleted')
                        for (var j = 0; j < $rootScope.pending.length; j++) {
                            if ($rootScope.pending[j].magnet === torrent.magnet) {
                                $rootScope.pending.splice(j, 1)
                            }
                        }
                        let local_pending = JSON.parse(localStorage.getItem('pending'))
                        for (var k = 0; k < local_pending.length; k++) {
                            if (local_pending[k].magnet === torrent.magnet) {
                                local_pending.splice(k, 1)
                            }
                        }
                        localStorage.setItem('pending', JSON.stringify(local_pending))
                    })
                }
            }
        })



    }
})();
