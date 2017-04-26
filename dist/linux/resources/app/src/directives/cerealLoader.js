(function() {
    'use strict';

    angular
        .module('app')
        .directive('cerealLoader', cerealLoader)

    /* @ngInject */
    function cerealLoader() {

        var directive = {
            link: link,
            scope: {
                type: '='
            },
            restrict: 'E',
            templateUrl: 'src/directives/cerealLoader.html'
        }
        return directive

        function link(scope) {}
    }
})();
