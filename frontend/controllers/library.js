angular.module('App')
    .controller('libraryCtrl', ['$scope', '$interval', function($scope, $interval) {

        let ioc = require('../../ioc')
        let fsExtra = require('fs-extra')
        let fsPath = require('fs-path')
        let jsonService = ioc.create('services/json-service')
        let commonService = ioc.create('services/common-service')

        $scope.locals = []

        jsonService.getCompleted().then((completed) => {
            console.log('Completed --->', completed)
            $scope.locals = completed
            $scope.$apply()
        })

        jsonService.getLibrary().then((library) => {
            console.log('Library --->', library)
        })

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
