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
                let fileName = 'Cereal-' + remote.getGlobal('config').remoteVersion + '.deb'
                let url = 'https://github.com/samCrock/cereal/raw/master/dist/' + fileName
                let out = fsExtra.createWriteStream('_update.tar')
                let total, increment = 0
                let updateProgress = 0;
                let req = request({
                    method: 'GET',
                    uri: url
                })

                req.pipe(out)

                req.on('response', function(data) {
                    total = data.headers['content-length']
                    console.log('Total', data.headers['content-length'])
                })

                req.on('data', function(chunk) {
                    increment += chunk.length
                })

                let interval_update = $interval(() => {
                    if (increment) console.log('Downloading ->', commonService.mapRange(increment, 0, total, 0, 100) + '%')
                }, 2000)

                req.on('end', function() {
                    $interval.cancel(interval_update)
                        fsExtra.rename('_update.tar', 'update.tar', () => {
                            console.log('New release ready! Refresh is advised..')
                        })
                })

            })
        }

        return update_module

    }
})()
