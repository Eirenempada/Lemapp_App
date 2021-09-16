// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('HaveaTalk', ['ionic', 'HaveaTalk.auth', 'starter.controllers', 'starter.services', 'HaveaTalk.constants', 'HaveaTalk.eventsList', 'HaveaTalk.eventsPast', 'HaveaTalk.eventsMap', 'HaveaTalk.eventsDetail'])


.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
    
    
    cordova.plugins.locationAccuracy.request(function (success){
        console.log("Successfully requested accuracy: "+success.message);
    }, function (error){
       console.error("Accuracy request failed: error code="+error.code+"; error message="+error.message);
       if(error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED){
           if(window.confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")){
               cordova.plugins.diagnostic.switchToLocationSettings();
           }
       }
    }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY);
    
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  .state('login', {
      url: '/login',
      controller: 'LoginCtrl',
      templateUrl: 'templates/login.html'
  })

  .state('register', {
      url: '/register',
      controller: 'RegisterCtrl',
      templateUrl: 'templates/register.html'
  })

  .state('event-detail', {
      url: '/event-detail',
      controller: 'eventsDetailController',
      templateUrl: 'templates/event-detail.html',
      cache: false,
      params: {
        'currentEventId' : 'default'
      }
  })

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.events-map', {
    url: '/events-map',
    cache: false,
    views: {
      'tab-events-map': {
        templateUrl: 'templates/tab-events-map.html',
        controller: 'eventsMapController'
      }
    }
  })

  .state('tab.events-list', {
    url: '/events-list',
    cache: false,
    views: {
      'tab-events-list': {
        templateUrl: 'templates/tab-events-list.html',
        controller: 'eventsListController'
      }
    }
  })

  .state('tab.events-past', {
    url: '/events-past',
    views: {
      'tab-events-past': {
        templateUrl: 'templates/tab-events-past.html',
        controller: 'eventsPastController'
      }
    }
  })

  .state('tab.chats', {
      url: '/chats',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-chats.html',
          controller: 'ChatsCtrl'
        }
      }
    })
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

})

.run(function ($rootScope, $state, AuthService, AUTH_EVENTS) {

  $rootScope.$on('$stateChangeStart', function (event,next, nextParams, fromState) {
    if (!AuthService.isAuthenticated()) {
      console.log('User pas authentifier');

      if (next.name !== 'login' && next.name !== 'register') {
        event.preventDefault();
        $state.go('login');
      }
    }
    if ((AuthService.isAuthenticated() == true) && (fromState.name == '') && (next.name == 'login') && (next.name !== 'tab.events-map')){
      event.preventDefault();
      $state.go('tab.events-map');
    }
  });

});
;