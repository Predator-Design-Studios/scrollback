scrollbackApp.controller('metaController',function($scope, $location, $factory) {
	$scope.profile = function() {
		if(/^guest-/.test($scope.user.id)) {
			$location.path("/me/login");
		}else{
			$location.path("/me/edit");	
		}
	};
	$scope.logout = function() {
		$factory.message({type:"nick", to:"", ref:"guest-"},function(message) {
			navigator.id.logout();
		});
	};
	// $factory.on("room", function(room){
	// 	if($scope.room.id == room.id) {
	// 		$scope.$apply(function() {
	// 			console.log("room setting....");
	// 			$scope.room = room;
	// 		});
	// 	}
	// });
	var statusObject = {};
	// function personaWatch() {
	// 	console.log("WATCHING...", $scope.nick
	// 	if(/^guest-/.test($factory.me)) {
	// 		navigator.id.watch({
	// 			onlogin:function(assertion) {
	// 			console.log("onLogin");
	// 			var message = {browserid:assertion, type: "nick", to:''};
	// 			$factory.message(message, function(resp) {
	// 				$location.path("/me");
	// 			});
	// 		},
	// 		onlogout: function() {}
	// 		});
	// 		//adding something to keep track of this..
	// 		navigator.id.watching = true;
	// 	}
	// }
});
scrollbackApp.controller('meController',['$scope','$route','$factory','$location',function($scope, $route, $factory, $location) {
	$scope.nickChange = function() {
		if($scope.user.id == "guest-"+$scope.displayNick){
			$location.path("/"+$scope.room.id);
			return;
		}
	    $factory.message({to:"",type:"nick", ref:"guest-"+$scope.displayNick}, function(message){
	    	if(message.message){
	    		//error
	    	}else{
	    		$location.path("/"+$scope.room.id);
	    	}
	    });
	};

	$scope.displayNick = ($scope.user.id).replace(/^guest-/,"");
	$scope.save = function() {
		$factory.message({to:"",type:"nick", user:{id:$scope.displayNick,accounts:[]}}, function(message) {
			if(message.message) {
				//err .
			}else{
				$location.path("/"+$scope.room.id);
			}
		});
	};
	$scope.personaLogin = function(){
		navigator.id.watch({
			onlogin: function(assertion){
				var message = {browserid:assertion, type: "nick", to:''};
				$factory.message(message, function(message){
					if(message.message && message.message == "AUTH_UNREGISTERED") $location.path("/me/edit");
					else if(!message.message) $location.path("/"+$scope.room.id);
				});
			},
			onlogout: function() {}
		});
		navigator.id.request();
	};
}]);


scrollbackApp.controller('roomcontroller', function($scope, $timeout, $factory, $location, $routeParams) {

	$factory.leaveRest($routeParams.room);
	if($scope.room.id == $routeParams.room){
		if($factory.isActive ){
			
		}else{
			$factory.on("connected", function(){
				$factory.enter($scope.room.id);		
			});
		}
		
	}else{
		$factory.rooms({id:$routeParams.room,fields:["accounts","members"]},function(room) {
			$scope.$apply(function(){
				$scope.room = room[0];
				$factory.enter($scope.room.id);
			});
		});	
	}
	$scope.isOwner = function() {
		if($scope.user.id == $scope.room.owner) return true;
		else return false;
	};
	$scope.goToConfigure = function() {
		$location.path("/"+$scope.room.id+"/edit");
	};
	$scope.partRoom = function() {
		var msg = {}, index,i,l;
		msg.to = $scope.room.id;
		msg.type = "part";
		$factory.message(msg);
		if($scope.user.membership){
			index = $scope.user.membership.indexOf($scope.room.id);
			if(index >= 0){
				$scope.user.membership.splice(index, 1);
				//deleting gravatar 
				for(i=0,l=$scope.members.length;i<l;i++) {
					if($scope.members[i].id === $scope.user.id){
						$scope.members.splice(i,1);
						break;
					}
				}
			}
		}
	};
	$scope.joinRoom = function() {
		var msg = {};
		if(/^guest-/.test($scope.user.id)){
			//guest
			$location.path('/me/login');
			return;
		}
		msg.to = $scope.room.id;
		msg.type = "join";
		$factory.message(msg);
		$scope.user.membership.push($scope.room.id);
		$scope.members.push($scope.user);
	};
	
	$scope.hasMembership = function() {
		if(!$scope.user.membership) return false;
		var index = $scope.user.membership.indexOf($scope.room.id);
		if(index > -1) return true;
		else return false;
	};
});

scrollbackApp.controller('roomscontroller', ['$scope', '$timeout' , function($scope, $timeout) {	
	$scope.isExists = function(m) {
		if (m && m.length > 0) {
			return true; 
		}
		else return false;
	};
}]); 

scrollbackApp.controller('configcontroller' , function($scope, $factory, $location, $rootScope, $routeParams) {
	var url;
	if($scope.user.id != $scope.room.owner && typeof $scope.room.owner!= "undefined") {
		$location.path("/")
		return;
	}
	$scope.name = $scope.room.name || $scope.room.id;
	$scope.description = $scope.room.description || $scope.room.description;
	if($scope.room.params){
		$scope.wordEnable = $scope.room.params.wordban?1:0;
		$scope.loginEnable = $scope.room.params.loginrequired?1:0;
		if($scope.room.accounts && $scope.room.accounts.forEach){
			$scope.room.accounts.forEach(function(account) {
				url = parseUrl($scope.room.accounts[0].id);
				if(url.protocol == "irc"){
					$scope.ircServer = url.hostname;
					$scope.ircRoom = url.hash;	
				}
			});
		}		
	}else{
		$scope.wordEnable = 0;
		$scope.loginEnable = 0;
		
	}
	$scope.cancel = function() {
		$location.path("/"+$scope.room.id);
	};
	$scope.saveRoom = function() {
		var room={};
		room.id = $scope.room.id;
		room.name = $scope.name || $scope.room.id;
		room.description = $scope.description || "";
		room.params = {};
		room.type = "room";
		room.params.wordban = $scope.wordEnable?true:false;
		room.params.loginrequired = $scope.loginEnable?true:false;
		if($scope.ircServer && $scope.ircRoom) {
			room.accounts = [
				{
					gateway: "irc",
					id:"irc://"+$scope.ircServer+"/"+$scope.ircRoom,
					room: $scope.room.id,
					params:{}
				}
			];
			room.params.irc = true;
		}else {
			room.params.irc = false;
		}
		$factory.room( room, function(room) {
			if(room.message)	alert(room.message);
			else {
				$scope.$apply(function(){
					$scope.room = room;
					$factory.emit("roomchange", room.id);
				});
				$location.path("/"+$scope.room.id);
			}
		});
	};
});

scrollbackApp.controller('rootController' , ['$scope', '$factory',  function($scope, $factory) {
	$factory.on('init', function(data){
		//assigning the new new init data to the user scope ---
		$scope.user.id = data.user.id;
		if(/^guest-/.test(data.user.id)){
			$scope.user.picture = "//s.gravatar.com/avatar/guestpic";
		}
		else{
			if(data.user.membership) {
				$scope.user.membership = Object.keys(data.user.membership);
			}
		}
	});
}]);

function parseUrl(url) {
	var a = document.createElement('a');
	var protocol = url.split(":")[0];
	url = url.replace(protocol,"http");
    a.href = url;
    return {protocol:protocol, hash:a.hash, hostname:a.hostname, search:a.search};
}
