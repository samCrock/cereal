(function() {
    'use strict';

    angular
        .module('app')
        .config(moduleConfig);

    require('./controllers/main.js')
    require('./controllers/library.js')
    require('./controllers/favourites.js')
    require('./controllers/calendar.js')
    require('./controllers/episode.js')

    require('./services/torrent-service.js')
    require('./services/wt-service.js')
    require('./services/common-service.js')
    require('./services/library-service.js')
    require('./services/json-service.js')
    require('./services/poster-service.js')

    /* @ngInject */
    function moduleConfig($stateProvider, $urlRouterProvider, $mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('cereal_palette', {
                'default': '200', // by default use shade 400 from the pink palette for primary intentions
                'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
                'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
                'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
            })
            // If you specify less than all of the keys, it will inherit from the
            // default shades
            .accentPalette('lime', {
                'default': '200' // use shade 200 for default, and keep all other shades the same
            })

        $mdThemingProvider.definePalette('cereal_palette', {
            '50': '#ffffff',
            '100': '#fdfefe',
            '200': '#d1f2ee',
            '300': '#99e3d9',
            '400': '#81ddd0',
            '500': '#69d6c7',
            '600': '#51cfbe',
            '700': '#39c9b5',
            '800': '#31b2a1',
            '900': '#2a9a8b',
            'A100': '#ffffff',
            'A200': '#fdfefe',
            'A400': '#81ddd0',
            'A700': '#39c9b5',
            'contrastDefaultColor': 'light',
            'contrastDarkColors': '50 100 200 300 400 500 600 700 800 A100 A200 A400 A700'
        })

        $urlRouterProvider.otherwise('/calendar')
            // Now set up the states
        $stateProvider
            .state('app', {
                url: '',
                abstract: true,
                views: {
                    'header@': {
                        controller: 'mainCtrl',
                        templateUrl: './frontend/partials/navbar.html'
                    }
                }
            })
            .state('app.favourites', {
                url: '/favourites',
                views: {
                    '@': {
                        controller: 'favouritesCtrl',
                        templateUrl: './frontend/partials/favourites.html'
                    }
                }
            })
            .state('app.library', {
                url: '/library',
                views: {
                    '@': {
                        controller: 'libraryCtrl',
                        templateUrl: './frontend/partials/library.html'
                    }
                }
            })
            .state('app.calendar', {
                url: '/calendar',
                views: {
                    '@': {
                        controller: 'calendarCtrl',
                        templateUrl: './frontend/partials/calendar.html'
                    }
                }
            })
            .state('app.episode', {
                url: '/episode',
                params: {
                    show: '',
                    episode: ''
                },
                views: {
                    '@': {
                        controller: 'episodeCtrl',
                        templateUrl: './frontend/partials/episode.html'
                    }
                }
            })
    }
})();
