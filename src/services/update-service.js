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
                let url = 'https://github.com/samCrock/cereal/raw/master/cereal_win32.tar.gz'
                let out = fsExtra.createWriteStream('new-release.tar.gz_')
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
                    if (increment) console.log('Dowloading ->', commonService.mapRange(increment, 0, total, 0, 100) + '%')
                }, 1000)

                req.on('end', function() {
                    $interval.cancel(interval_update)
                    fsExtra.rename('new-release.tar.gz_', 'new-release.tar.gz', () => {
                        console.log('New release ready! Refresh is advised..')
                    })
                })
                        
            })
        }

        return update_module

    }
})()
