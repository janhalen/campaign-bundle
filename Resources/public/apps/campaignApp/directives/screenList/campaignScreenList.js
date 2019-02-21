/**
 * @file
 * Screen list.
 */

/**
 * Directive to show the Screen overview.
 */
angular.module('campaignApp').directive('campaignScreenList', [
  'busService', '$translate',
  function (busService, $translate) {
    'use strict';

    return {
      restrict: 'E',
      scope: {
        selectedScreens: '=',
        overlay: '@'
      },
      controller: function ($scope, $filter, $controller, screenFactory, userService, busService) {
        $controller('BaseSearchController', {$scope: $scope});

        // Get filter selection "all/mine" from localStorage.
        $scope.showFromUser = localStorage.getItem('overview.media.search_filter_default') ? localStorage.getItem('overview.media.search_filter_default') : 'all';

        // Screens to display.
        $scope.screens = [];

        var previousSearchIds = null;

        /**
         * Updates the screens array by send a search request.
         */
        $scope.updateSearch = function () {
          // Get search text from scope.
          $scope.baseQuery.text = $scope.search_text;

          $scope.loading = true;

          screenFactory.searchScreens($scope.baseQuery).then(
            function (data) {
              // Total hits.
              $scope.hits = data.hits;

              // Extract search ids.
              var ids = [];
              for (var i = 0; i < data.results.length; i++) {
                ids.push(data.results[i].id);
              }

              // Only extract new results if new results.
              if (previousSearchIds &&
                ids.length === previousSearchIds.length &&
                ids.every(function (v, i) { return v === previousSearchIds[i];})
              ) {
                $scope.loading = false;
                return;
              }

              previousSearchIds = ids;

              // Load slides bulk.
              screenFactory.loadScreensBulk(ids).then(
                function (data) {
                  $scope.screens = data;

                  $scope.loading = false;
                },
                function (reason) {
                  busService.$emit('log.error', {
                    'cause': reason,
                    'msg': $translate('common.error.could_not_load_results')
                  });
                  $scope.loading = false;
                }
              );
            }
          );
        };

        /**
         * Returns true if screen is in selected screens array.
         *
         * @param screen
         * @returns {boolean}
         */
        $scope.screenSelected = function screenSelected (screen) {
          if (!$scope.selectedScreens) {
            return false;
          }

          var res = false;

          $scope.selectedScreens.forEach(function (element) {
            if (element.id === screen.id) {
              res = true;
            }
          });

          return res;
        };

        /**
         * Emits the screenList.clickScreen event.
         *
         * @param screen
         */
        $scope.clickScreen = function clickScreen(screen) {
          $scope.$emit('screenList.clickScreen', screen);
        };

        /**
         * Update search result on screen deletion.
         */
        $scope.$on('screen-deleted', function () {
          $scope.updateSearch();
        });

        /**
         * Updates the search filter based on current orientation and user
         */
        $scope.setSearchFilters = function setSearchFilters () {
          delete $scope.baseQuery.filter;

          // No groups selected and "all" selected => select all groups and my.
          var selectedGroupIds = $filter('filter')($scope.userGroups, {selected: true}, true)
          .map(function (group) {
            return group.id;
          });

          $scope.baseQuery.filter = $scope.baseBuildSearchFilter(selectedGroupIds);

          $scope.pager.page = 0;

          $scope.updateSearch();
        };

        $scope.setSearchFilters();
      },
      templateUrl: 'bundles/os2displaycampaign/apps/campaignApp/directives/screenList/campaignScreenList.html?' + window.config.version
    };
  }
]);
