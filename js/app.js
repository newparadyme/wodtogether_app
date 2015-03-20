
angular.module('wodtogether', ['ionic', 'wodtogether.controllers', 'wodtogether.services'])

.run(function($ionicPlatform, $rootScope) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleDefault();
		}
	});
})

.config(function($stateProvider, $urlRouterProvider) {
	$stateProvider

	.state('login', {
		url: "/login",
		templateUrl: "templates/login.html",
		controller: 'LoginCtrl'
	})
	
	.state('app', {
		url: "/app",
		abstract: true,
		templateUrl: "templates/menu.html",
		controller: 'AppCtrl'
	})
	
	.state('app.home', {
		url: "/home",
		abstract: true,
		views: {
			'menuContent': {
				templateUrl: "templates/home_tabs.html"
			}
		}
	})
	
	.state('app.home.wods', {
		url: "/wods",
		views: {
			'home_tabs-wods': {
				templateUrl: 'templates/home_tabs-wods.html',
				controller: 'HomeCtrl'
			}
		}
	})
	
	.state('app.home.discussion', {
		url: "/discussion",
		views: {
			'home_tabs-discussion': {
				templateUrl: 'templates/home_tabs-discussion.html',
				controller: 'HomeCtrl'
			}
		}
	})
;
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/login');
});
