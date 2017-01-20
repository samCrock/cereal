(function() {
    'use strict'

    angular
        .module('app', ['ngMaterial', 'ngMdIcons', 'ui.router', 'pascalprecht.translate'])
        .config(function($translateProvider) {
            $translateProvider
                .translations('en', { key: 'translated' })
                .use('en');
        })
        .constant('CONFIG' , {
        	engines: 1 // Number of torrent engines to use before rejecting searchTorrent (3 == all)
        })

})()
