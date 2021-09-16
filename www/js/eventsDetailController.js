/*
* A nouveau utilisation de AuthService JSON.stringify à corriger !
*/

angular.module('HaveaTalk.eventsDetail', ['angular-storage'])

.controller("eventsDetailController", function($stateParams, $ionicPopup, AuthService, $sce, $log, $scope, $http, apiUrl, $state, store) {
	
  $scope.loadEventDetail = function () {
    console.log('lancement du scope.loadEventDetail');

		$http({
				method: 'GET',
				url: apiUrl + '/events/' + $stateParams.currentEventId
		}).success(function (event) {
			$scope.currentEventDetail = event[0];
      $scope.currentEventParticipants = event[0].userId;
      $scope.showRemoveUser = false;
      $scope.showAddUser = false;

      console.log('$scope.currentEventDetail' + JSON.stringify($scope.currentEventDetail));


      $scope.loadParticipant = function(){
        var currentUserId = store.get('currentUserId');
        var space = '';
        var isInEvent = 0;
        
        $scope.showAddUser = '';
        $scope.showRemoveUser = '';

        
        for (var i=0; i<event[0].space; i++) {
            if(event[0].userId[i] == currentUserId){
              isInEvent = 1;
            }
            if(((event[0].userId[i]) == null) && (i != (event[0].space - 1))){
              //space = space + "<button><i class='fa fa-circle-thin'></i></button>"; 
            }
            if((event[0].userId[i] != null) && (i != (event[0].space - 1))){
              //space = space + "<button><i class='fa fa-user'></i></button>";
            }
            if((isInEvent == 1) && (i == (event[0].space - 1))){
              $scope.showRemoveUser = true;
              //space = space + '<button ng-controller="user2EventCtrl" ng-click="removeUser2Event(event._id)"><i class="fa fa-user-times"></i></button>';
            }
            if((isInEvent == 0) && (i == (event[0].space-1))){
              $scope.showAddUser = true;
              //space = space + '<button ng-controller="user2EventCtrl" ng-click="addUser2Event(event._id)"><i class="fa fa-user-plus"></i></button>';
            }
          }
          $scope.currentEventParticipantsButtons = space;
        }
        $scope.loadParticipant();
		});

	}
  
	$scope.loadEventDetail();

   $scope.addUser2Event = function() {
    var currentUserId = store.get('currentUserId');
    var addPopup = $ionicPopup.alert({
        title: 'Evénement rejoint !',
        template: "Vous participez à l'événement et nous vous souhaitons d'y passer un chouette moment !"
    });
    $http({
        method: 'PUT',
        url: apiUrl + '/events/' + $stateParams.currentEventId + '/adduser',
        data: '{"userId":"' + currentUserId + '"}'
    }).success(goDetailEvent) //remplacer goDetailEvent par Refrehs
    };

    $scope.removeUser2Event = function() {
    var currentUserId = store.get('currentUserId');
    var removePopup = $ionicPopup.alert({
        title: 'Evénement quitté !',
        template: "Vous ne participez plus l'événement. Une autre fois !"
    });
      $http({
        method: 'PUT',
        url: apiUrl + '/events/' + $stateParams.currentEventId + '/removeuser',
        data: '{"userId":"' + currentUserId + '"}'
    }).success(goDetailEvent) //remplacer goDetailEvent par Refresh
    };

    function goDetailEvent(event)
    {
      $state.reload();
      $state.go('tab.events-list'); //appliquer sur bouton
    };



})

.controller("backCtrl", function($scope, $ionicHistory) {

	$scope.backPreviousView = function() {
		$ionicHistory.goBack(); //Ajouter .clearCach() quelquepart
	};



})

.controller("user2EventCtrl", function($http, apiUrl, $log, $scope, $state, AuthService, store) {
  
  $scope.addUser2Event = function(eventId) {
    var currentUserId = store.get('currentUserId');
      $http({
        method: 'PUT',
        url: apiUrl + '/events/' + eventId + '/adduser',
        data: '{"userId":"' + currentUserId + '"}'
    }).success(goDetailEvent) //remplacer goDetailEvent par Refrehs
    };

    $scope.removeUser2Event = function(eventId) {
    var currentUserId = store.get('currentUserId');
      $http({
        method: 'PUT',
        url: apiUrl + '/events/' + eventId + '/removeuser',
        data: '{"userId":"' + currentUserId + '"}'
    }).success(goDetailEvent) //remplacer goDetailEvent par Refresh
    };

    function goDetailEvent(event)
    {
      $state.go('event-detail', { 'currentEventId' : event._id }); //appliquer sur bouton
    };

})
;

