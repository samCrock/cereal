(function() {
    'use strict';

    angular
        .module('app')
        .service('messageService', messageService);

    /* @ngInject */
    function messageService($mdDialog) {

        let message_module = {}

        message_module['notify'] = function notify(notifyObj) {
            $mdDialog.show(
                $mdDialog.alert()
                .parent(angular.element(document.querySelector('#popupContainer')))
                .clickOutsideToClose(true)
                .title(notifyObj.title)
                .textContent(notifyObj.content)
                .ariaLabel('Yo')
                .ok('OK')
                // .targetEvent(ev)
            );
        }

        return message_module
    }
})();
