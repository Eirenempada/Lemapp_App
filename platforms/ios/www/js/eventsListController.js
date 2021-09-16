angular.module('HaveaTalk.eventsList', ['angular-storage'])

.controller("eventsListController", function($log, AuthService, $scope, $http, apiUrl, $state, store) {
	
	$scope.loadEventsList = function () {
		$scope.currentUserId = store.get('currentUserId');
		console.log('current User id: ' + JSON.stringify($scope.currentUserId));
		$http.get(apiUrl + '/events').success(function (events) {
			$scope.events = events;
			console.log(events);


			index = 0;

			while (index < events.length)
			{
				$scope.events[index].isInEvent = '';
			    $scope.currentEvent = events[index].name;
			   
		        var space = '';
		        var isInEvent = false;
		        
			    index++;
			}

		});
	};
	$scope.loadEventsList();

	$scope.goDetail = function(event){
		$state.go('event-detail', { 'currentEventId' : event._id }); //appliquer sur bouton
	}
});