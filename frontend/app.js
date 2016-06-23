
let App = angular.module('App', ['ngMaterial', 'ngMdIcons', 'ui.router'])

App.config(($stateProvider, $urlRouterProvider) => {
    //
    // For any unmatched url, redirect to /state1
    // $urlRouterProvider.when('', '/library')

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
})

require('./controllers/main.js')
require('./controllers/library.js')
require('./controllers/favourites.js')
require('./controllers/calendar.js')
require('./controllers/episode.js')
