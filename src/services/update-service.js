(function() {
    'use strict';

    angular
    .module('app')
    .service('updateService', updateService)

    /* @ngInject */
    function updateService(commonService, $rootScope, $interval) {

        let request = require('request')
        let Promise = require('bluebird')
        let fsExtra = require('fs-extra')

        let update_module = {}

        update_module['downloadDistro'] = function get() {
            return new Promise((resolve, reject) => {
                
                let fileName = 'w-release.zip'
                let url = 'https://github.com/samCrock/cereal/archive/' + fileName
                let out = fsExtra.createWriteStream('_update.zip')
                let total 
                let increment = 0
                let updateProgress = 0;
                let req = request({
                    method: 'GET',
                    uri: url
                })

                req.pipe(out)

                req.on('response', function(data) {
                    total = data.headers['content-length']
                    console.log('Response headers ->', data.headers)
                })

                req.on('data', function(chunk) {
                    increment += chunk.length
                })

                let interval_update = $interval(() => {
                    if (increment && total) {
                        let update_progress = commonService.mapRange(increment, 0, total, 0, 100) + '%'
                        console.log('Downloading ->', update_progress)
                        $rootScope.update_progress = 'Downloading updates ' + update_progress
                    } else {
                        $rootScope.update_progress = 'Downloading updates'
                    }
                }, 2000)

                req.on('end', function() {
                    $interval.cancel(interval_update)
                    fsExtra.rename('_update.zip', 'update.zip', () => {
                        console.log('New release ready! Refresh is advised..')
                    })
                    $rootScope.update_progress = 'Update ready'
                })

            })
        }

        return update_module

    }
})()
