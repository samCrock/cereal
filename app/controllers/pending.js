(function() {
    'use strict';

    angular
        .module('app')
        .controller('pendingCtrl', pendingCtrl);

    function pendingCtrl($rootScope, $state, $scope, $interval, wtService) {

        $rootScope.loading = false
        const wt_client = wtService.client()

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

    }
})();
