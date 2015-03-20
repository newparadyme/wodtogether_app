angular.module('wodtogether.controllers', [])

.controller('AppCtrl', function($scope, $state, API) {	
	$scope.logout = function() {
		console.log("logout");
		API.logout();
		$state.go("login");
		console.log("go to login");
	};
	
	$scope.getDateInfo = function(d) {
		if (!angular.isDate(d)) {
			d = new Date(d);
			d.setDate(d.getDate()+1);
		}
		
		var year = d.getFullYear();
		var month = d.getMonth() + 1;
		if (month < 10) {
			month = '0' + month;
		}
		var day = d.getDate();
		if (day < 10) {
			day = '0' + day;
		}
		
		var ymd = '' + year + month + day;
		var y_m_d = year + '-' + month + '-' + day;
		
		return {
			year: year,
			month: month,
			day: day,
			ymd: ymd,
			y_m_d: y_m_d
		}
	};
})

.controller('LoginCtrl', function($scope, $state, API) {
	$scope.login = function(email, password) {
		API.login({
			email: email,
			password: password
		}).then(function(login_result) {
			if (login_result && login_result.access_token) {
				$state.go("app.home.wods", {}, {reload: true});
			}
		});
	};
	
	if (API.getUserData()) {
		console.log("already logged in?");
		$state.go("app.home.wods");
	}
})

.controller('HomeCtrl', function($scope, $state, API) {
	$scope.wodsSelect = {};
	$scope.dailyComments = {};
	$scope.getCount = function() { 
		console.log("WTFFFFFFF");
		return 321; 
	};
	
	var user_data = API.getUserData();
	if (!user_data) {
		$state.go("login");
		return;
	}
	
	$scope.changeDate = function(direction) {
		var d = new Date($scope.tabdate);
		if (direction == "prev") {
			d.setDate(d.getDate() - 1);
			date_info = $scope.getDateInfo(d);
		} else if (direction == "next") {
			d.setDate(d.getDate() + 1);
			date_info = $scope.getDateInfo(d);
		} else {
			date_info = $scope.getDateInfo(d);
		}
		
		$scope.tabdate = d;

		var params = {
			method: "wodsSelect",
			date: date_info.ymd
		};
		API.post(params).then(function(response) {
			console.log("API.post.then response: ", response);
			var api_response = response.data;
			if (api_response.response_code > 0) {
				$scope.wodsSelect.data = api_response.data;
				$scope.wodsSelect.empty = (api_response.data.wods.length < 1);
			} else {
				// error fetching wods
			}
		});
		
		var params = {
			method: "gyms/dailyComments",
			date: date_info.ymd,
			gid: user_data.user.gym_id
		};
		API.post(params).then(function(response) {
			var api_response = response.data;
			if (api_response.response_code > 0) {
				$scope.dailyComments.data = api_response.data;
				$scope.dailyComments.count = api_response.data.comments.length;
			} else {
				// error fetching comments
			}
		});
	};
	
	if ($scope.tabdate == "today" || !$scope.tabdate) {
		$scope.tabdate = new Date();
		$scope.changeDate($scope.tabdate);
	}
})
;
