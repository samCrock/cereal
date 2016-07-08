angular.module('App')
    .controller('libraryCtrl', ['$rootScope', '$scope', '$interval', function($rootScope, $scope, $interval) {
        console.log('Library')
        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')

        let commonService = ioc.create('services/common-service')
        let jsonService = ioc.create('services/json-service')

        $scope.default_poster = './res/posters/default.jpg'

        $scope.watch = (local) => {
            let fileName = local.path.split('/')
            fsExtra.readdir(local.path, (err, files) => {
                if (err) return console.error(err)
                files.filter((file) => {
                    let ext = file.split('.')
                    ext = ext[ext.length - 1]
                        // console.log(ext, local.extension)
                    if (ext === local.extension) {
                        console.log(local.path + '/' + file)
                        commonService.openFile(local.path + '/' + file)
                    }
                })
            })
        }


    }])
