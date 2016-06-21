let App = angular.module('App', ['ngMaterial', 'ngMdIcons', 'ui.router'])

App.config(($stateProvider, $urlRouterProvider) => {
    //
    // For any unmatched url, redirect to /state1
    // $urlRouterProvider.when('', '/library')

    // $urlRouterProvider.otherwise('/library')
        // Now set up the states
    $stateProvider
        // .state('app', {
        //     url: '',
        //     views: {
        //         '@': {
        //             controller: 'mainCtrl'
        //         }
        //     }
        // })
        .state('favourites', {
            url: '/favourites',
            views: {
                '@': {
                    controller: 'favouritesCtrl',
                    templateUrl: './frontend/partials/favourites.html'
                }
            }
        })
        .state('library', {
            url: '/library',
            views: {
                '@': {
                    controller: 'libraryCtrl',
                    templateUrl: './frontend/partials/library.html'
                }
            }
        })
        .state('calendar', {
            url: '/calendar',
            templateUrl: './frontend/partials/calendar.html'
        })
})

require('./controllers/main.js')
require('./controllers/library.js')
require('./controllers/favourites.js')
