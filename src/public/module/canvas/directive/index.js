angular.module('canvas').directive("canvas", [
    function () {

        "use strict";

        return {
            restrict: "A",
            scope: { manager: "=canvas" },
            controller: [

                "$scope",
                "$element",

                function ($scope, $element) {
                    var width = $scope.manager.width(),
                        height = $scope.manager.height(),
                        canvas = angular.element("<canvas width='" + width + "' height='" + height + "'>");

                    canvas.css({background: '#444'});

                    $element.append(canvas);

                    $scope.manager.ctx(canvas.get(0));
                }
            ]
        };
    }
]);
