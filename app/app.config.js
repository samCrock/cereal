(function() {
    'use strict';

    angular
        .module('app')
        .config(moduleConfig);

    require('./controllers/main.js')
    require('./controllers/library.js')
    require('./controllers/favourites.js')
    require('./controllers/calendar.js')
    require('./controllers/pending.js')
    require('./controllers/episode.js')
    require('./controllers/show.js')
    require('./controllers/search.js')

    require('./services/torrent-service.js')
    require('./services/wt-service.js')
    require('./services/common-service.js')
    require('./services/library-service.js')
    require('./services/json-service.js')
    require('./services/poster-service.js')
    require('./services/subs-service.js')
    require('./services/search-service.js')

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
            .accentPalette('cereal_palette', {
                'default': '200' // use shade 200 for default, and keep all other shades the same
            })

        $mdThemingProvider.definePalette('cereal_palette', {
            '50': '#ffffff',
            '100': '#f7fdfb',
            '200': '#e4f7f2',
            '300': '#d0f1e9',
            '400': '#bdebe0',
            '500': 'a9e5d7',
            '600': '#95dfce',
            '700': '#82d9c5',
            '800': '#6ed3bc',
            '900': '#5bcdb3',
            'A100': '#ffffff',
            'A200': '#ffffff',
            'A400': '#ffffff',
            'A700': '#47c7a9',
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
                        templateUrl: './app/partials/navbar.html'
                    }
                }
            })
            .state('app.favourites', {
                url: '/favourites',
                views: {
                    '@': {
                        controller: 'favouritesCtrl',
                        templateUrl: './app/partials/favourites.html'
                    }
                }
            })
            .state('app.library', {
                url: '/library',
                views: {
                    '@': {
                        controller: 'libraryCtrl',
                        templateUrl: './app/partials/library.html'
                    }
                }
            })
            .state('app.calendar', {
                url: '/calendar',
                views: {
                    '@': {
                        controller: 'calendarCtrl',
                        templateUrl: './app/partials/calendar.html'
                    }
                }
            })
            .state('app.pending', {
                url: '/pending',
                views: {
                    '@': {
                        controller: 'pendingCtrl',
                        templateUrl: './app/partials/pending.html'
                    }
                }
            })
            .state('app.search', {
                url: '/search',
                views: {
                    '@': {
                        controller: 'searchCtrl',
                        templateUrl: './app/partials/search.html'
                    }
                }
            })
            .state('app.show', {
                url: '/show',
                params: {
                    show: '',
                    episode: ''
                },
                views: {
                    '@': {
                        controller: 'showCtrl',
                        templateUrl: './app/partials/show.html'
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
                        templateUrl: './app/partials/episode.html'
                    }
                }
            })
    }
})();