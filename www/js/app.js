// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var pointOfOrder=angular.module('pointOfOrder', ['ionic', 'base64', 'ionic.native'])

.run(function($ionicPlatform, $rootScope, storageService, $http,utilities, worlds, $state,$window, $cordovaAdMobFree, $timeout, $ionicPopup) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    };

      $ionicPlatform.onHardwareBackButton(function(event){
        event.preventDefault();
        event.stopPropagation();
      }, false);

      $ionicPlatform.registerBackButtonAction(function (event) {
            event.preventDefault();
            event.stopPropagation();
      }, 100);

    $rootScope.interstitialAdvert=$cordovaAdMobFree.interstitial;
    $rootScope.interstitialAdvert.config({
              // id: 'ca-app-pub-3940256099942544/1033173712', //this is the test ad unit
              // isTesting: true,

              id: 'ca-app-pub-9766939604775958/9521973240',
              isTesting: false
              
        });

      $rootScope.runAdverts=function(){
                try{

                    $rootScope.interstitialAdvert.prepare();
                    return $rootScope.interstitialAdvert.show();
                    
                    }catch(err){

                    return err;
              }
        }
 
  });

  /********************************* THESE ARE FUNCTIONS THAT ARE DEFINED FOR THE ROOTSCOPE **********************************/
  $rootScope.appShutdown = function() {
    $timeout(function(){
          ionic.Platform.exitApp();
    },3000)
  };

  $rootScope.ContextLost_btn = function(){
    localStorage.clear();

    $timeout(function(){
        $state.go('app.home');
        $window.location.reload();
    },1000);
  };

    function setDefaults(){

      var sess_array=storageService.get('sess_array');
      if (sess_array=='undefined' || sess_array==null || sess_array==NaN) {
          storageService.set('sess_array', []);
      }
  };
  
  setDefaults();
  $rootScope.charsHaveLoaded=false;
  worlds.setupContext();
  worlds.createClouds();
  worlds.createFieldUtils();


})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $httpProvider) {
  
  $stateProvider

    .state('app',{
      url: '/app',
      abstract: true,
      templateUrl: 'templates/app.html',
      disableHardwareBackButton : true
    })
    .state('app.home',{
      url: '/home',
      views:{
        'content': {
          templateUrl: 'templates/home.html',
          disableHardwareBackButton : true,
          controller:  'homeCtrl'
        }
      }
    })
    .state('app.play', {
      url: '/play',
      views: {
        'content': {
          templateUrl: 'templates/play.html', 
          disableHardwareBackButton : true,
          controller: 'playCtrl'
        }
      }
    })
    .state('app.about', {
      url: '/about',
      views: {
        'content': {
          templateUrl: 'templates/about.html', 
          disableHardwareBackButton : true,
          controller: 'homeCtrl'
        }
      }
    })
        .state('app.instructions', {
      url: '/instructions',
      views: {
        'content': {
          templateUrl: 'templates/instructions.html', 
          disableHardwareBackButton : true,
          controller: 'homeCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/home');
  $ionicConfigProvider.views.maxCache(0);
});