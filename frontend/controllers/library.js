angular.module('app')
    .controller('libraryCtrl', ['$rootScope', '$scope', '$state', function($rootScope, $scope, $state) {
        console.log('Library')
        $rootScope.loading = false
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let commonService = ioc.create('services/common-service')
        // let libraryService = ioc.create('services/library-service')
        let torrentService = ioc.create('services/torrent-service')



        // libraryService.getLibrary().then((library) => {
        //     console.log('Library --->', library)
        //         // let ranges = commonService.putInRange(library)
        //         // $rootScope.ranges = ranges
        //         // console.log('**********')
        //         // console.log(ranges)
        //         // console.log('**********')
        //         // $rootScope.$apply()
        // })

        $scope.currents = torrentService.getCurrents()
        console.log('currents ->', $scope.currents)

        $scope.watch = (show) => {
            $state.go(app.episode({ show: show.title, episode: show.episode }))
        }


    }])
