(function(){

	'use strinct';

	pointOfOrder.controller('homeCtrl',function($rootScope, $ionicModal, utilities, $ionicLoading, $ionicPopover, $window, $document, $state, $ionicPopup, $stateParams, $timeout, $scope, $base64, storageService){

		$scope.HighScore=function(){
			  var sess_arr=storageService.get('sess_array');
		      var scores=[];
		      var i=0;
		      var k=sess_arr.length;
		      var highestScore;

		      if (k>0) {
		        for(i;i<k;i++){
		              if (sess_arr[i].inflatable===false) {
		                  scores.push(sess_arr[i].score);
		              };
		        };

		        highestScore=utilities.arrMaxMin('max', scores);
		        sess_arr.forEach(function(sess){
		            if (sess.score==highestScore) {
		                $scope.starlet=sess.score;
		            };
		        });

		        $ionicPopup.show({
		          scope: $scope,
		          templateUrl: 'highScoreHUD.html',
		          buttons: [{ text: 'Done' }]
		         
		        })
		      };
		};

		$scope.newGame=function(){
			$state.go('app.play');
			$rootScope.sessType='newGame';
		};

		$scope.continue=function(){
			$state.go('app.play');
			$rootScope.sessType='continue';

		};

		$scope.homePrep=function(){

			$scope.openSess=false;
			var sess_array=storageService.get('sess_array');

			if (sess_array.length>0) {
				var lastObj=sess_array.length-1;

				if (sess_array[lastObj].inflatable) {
					$scope.openSess=true;
				}


				sess_array.forEach(function(sess){
	                if (sess.inflatable===false) {$scope.HighScoreAvailable=true;}
	            });

				return
			};


		}
	});


pointOfOrder.controller('playCtrl',function($rootScope,sesssFactory, $ionicModal, utilities, $ionicLoading, $ionicPopover, $window, $document, $state, $ionicPopup, $stateParams, $timeout, $scope, $base64, storageService){

	var clock=new THREE.Clock();
	var pauseSession='off';
    var INV_MAX_FPS=1/60;
    var frameDelta=0;
	var requestID;
	var chrono_count=0;
	var chrono=false;
	var shoot_allowed=false;
	var xDir='positive';
	var memberZone='A';

	$scope.hittable=true;
	$scope.vibratos=true;


	$scope.isStageChanging=false;
	$scope.addLifeDisp=false;

    var trueCoords_dn={};
    var trueCoords_up={};
    const halfHeight=$window.innerHeight/2;
    const halfWidth=$window.innerWidth/2;
    var unitVector=new THREE.Vector3();

	var stats=initStats(); //togo
  	$scope.showStats=false; //togo
	function initStats(){var stats=new Stats();$("#Stats").append(stats.domElement);return stats;}; //togo
	var camRotStep=0; //togo
	const camPoint=new THREE.Vector3(0,150,0); //togo
	$scope.spin=false; //togo

	$scope.restoreBall=function(){

		$rootScope.scene.remove($rootScope.ball);
		$rootScope.scene.add($rootScope.ball);

		$rootScope.ball.__dirtyPosition=true;
        $rootScope.ball.setAngularVelocity(new THREE.Vector3());
        $rootScope.ball.setLinearVelocity(new THREE.Vector3(0,10,0));
        $rootScope.ball.position.x=-800;
        $rootScope.ball.position.y=30;
        $rootScope.ball.position.z=0;
        $scope.hittable=true; 
	};

	$scope.setVibratos=function(){

        if ($scope.vibratos) {
         $scope.vibratos=false;
          return;
        }

        $scope.vibratos=true;    };

	$scope.checkBall=function(){

		var CB_vx, CB_vy, CB_vz, CB_magnitude;
		CB_vx=Math.floor($rootScope.ball.getLinearVelocity().x);
		CB_vy=Math.floor($rootScope.ball.getLinearVelocity().y);
		CB_vz=Math.floor($rootScope.ball.getLinearVelocity().z);

		CB_magnitude=Math.sqrt(Math.abs(CB_vx+CB_vy+CB_vz));
		if (CB_magnitude<30 && ($rootScope.ball.position.y<60 || $rootScope.ball.position.x>$rootScope.activeMember.position.x)) {
			$scope.restoreBall();
		}else{
			console.log('vibrate');
		}
	}

	$scope.restoreBall();
	if ($rootScope.sessType==undefined) {$rootScope.sessType='newGame'};
	switch($rootScope.sessType){
		case 'newGame':
			 $scope.sessobj=new sesssFactory.session();
        	 $rootScope.renderer.compile($rootScope.scene, $rootScope.camera);
			 $rootScope.ball.setLinearVelocity(new THREE.Vector3(0,1,0));
			 setLevel($scope.sessobj.level);
			 animate();

		break;
		case 'continue':
			 var sess_array=storageService.get('sess_array');
			 var lastObj=sess_array.length-1;
			 $scope.sessobj=sess_array[lastObj];
        	 $rootScope.renderer.compile($rootScope.scene, $rootScope.camera);
			 $rootScope.ball.setLinearVelocity(new THREE.Vector3(0,1,0));
			 setLevel($scope.sessobj.level);
			 animate();
		break;
	};

     var output=document.getElementById('output');
     $timeout(function(){

      if (output) {
        output.append($rootScope.renderer.domElement);
      }

     },200);

    $scope.$on('$destroy', function(e){
       e.preventDefault();
      $rootScope.renderer.domElement.removeEventListener('touchstart', $scope.onFingerTap, false); 
      $rootScope.renderer.domElement.removeEventListener('touchend', $scope.onFingerRelease, false); 

       $window.cancelAnimationFrame(requestID);
       output.remove($rootScope.renderer.domElement);      
       delete $scope.sessobj;
	});


	$scope.pause=function(){
		
		var sess_array=storageService.get('sess_array');
		sess_array.push($scope.sessobj);
		storageService.set('sess_array', sess_array);
		 $rootScope.runAdverts();
		$state.go('app.home');
	};

      
      $scope.onFingerTap=function(e){
        e.preventDefault(); 

        var _raycaster = new THREE.Raycaster();
      	var _selected = null;
      	var listenerElement=$rootScope.renderer.domElement;
      	var camera=$rootScope.camera
      	var _mouse={};
        var rect=listenerElement.getBoundingClientRect();

          //give normalized coordinates (for the purpose of determining if we touched an object or not)
        _mouse.x = ( (e.targetTouches[0].clientX - rect.left) / rect.width ) * 2 - 1;
        _mouse.y = - ( (e.targetTouches[0].clientY - rect.top) / rect.height ) * 2 + 1;

        _raycaster.setFromCamera( _mouse, camera);
        var intersects = _raycaster.intersectObject($rootScope.ball);

        var rawcoords_dn={i:e.targetTouches[0].clientX,j:e.targetTouches[0].clientY};
        if (intersects.length>0) {
          	//if the ball is selected we start to enable speed count
          	 chrono=true;
          	 chrono_count=0;
          	 shoot_allowed=true;
	        // console.log('raw coordinates ', rawcoords);
        };        

	        trueCoords_dn.i=(rawcoords_dn.i-halfWidth);
	        trueCoords_dn.j=(-rawcoords_dn.j+halfHeight);
      };

    $scope.onFingerRelease=function(e){
    e.preventDefault(); 
     chrono=false;
           
        var rawcoords_up={i:e.changedTouches[0].clientX,j:e.changedTouches[0].clientY};
        var directions=unitVector;
        var force;

        trueCoords_up.i=(rawcoords_up.i-halfWidth);
        trueCoords_up.j=(-rawcoords_up.j+halfHeight);

        if(trueCoords_up.i==trueCoords_dn.i && trueCoords_up.j == trueCoords_dn.j){
        	shoot_allowed=false;
        	return;
        };

	        //beneath are calculations that determine how the game functions:
        	// The speed of the swipe and length of the swipe (chrono_count) will determine the power of the impulse
        	// The vertical scalar of the swipe's length will determine how high the ball goes
        if (shoot_allowed && $rootScope.ball.position.x<-750) {

        directions.x=(trueCoords_up.j-trueCoords_dn.j)*2.5;
        directions.y=(trueCoords_up.j-trueCoords_dn.j)*0.65;
        directions.z=(trueCoords_up.i-trueCoords_dn.i)*1.5;

        var swipeVert=Math.abs(trueCoords_up.j-trueCoords_dn.j);
        var power=(swipeVert*23)/(chrono_count);
     
        force=(new THREE.Vector3(directions.x,directions.y,directions.z)).normalize();
        force.multiplyScalar(power);
    	$rootScope.ball.applyImpulse(force, new THREE.Vector3());
	 }
		shoot_allowed=false;
};


// var BM_vx, BM_vy, BM_vz, BM_magnitude;
// var BM_speedCondition=(BM_magnitude<=10 && ($rootScope.ball.position.x>-400 || $rootScope.ball.position.y<80) )
function ballMonitor() {
	
	// if ($rootScope.ball.position.x>0 && $rootScope.ball.position.x<150) {console.log($rootScope.ball.position.y)};
	// chrono_count is a value used to measure the speed of the user's swipe. the higher the chrono, the slower the swipe was
	if (chrono) {
		chrono_count++;
	};

	if ($rootScope.ball.position.x>750 || utilities.showCamContents($rootScope.ball)===false || $rootScope.ball.position.y<0 ) {

		$scope.restoreBall();
	};	
};

$rootScope.renderer.domElement.addEventListener('touchstart', $scope.onFingerTap, false);
$rootScope.renderer.domElement.addEventListener('touchend', $scope.onFingerRelease, false); 

function setLevel(val){

	$scope.sessobj.level=val;
	$scope.isStageChanging=true;
	
	$timeout(function(){
		$scope.isStageChanging=false;
		$scope.$apply();
	},1500);
};

function memberSteer(xInc, yInc, zInc, zSPCR){

  if (xDir==='positive') {
     x_step=x_step+xInc;
     y_step=y_step+yInc;

     z_step=z_step+zInc;
     z_spcr=z_spcr+zSPCR;
  
  }else{

      x_step=x_step-xInc;
      y_step=y_step-yInc;

      z_step=z_step+zInc;
      z_spcr=z_spcr-zSPCR;
  }
};

function zoneReader(){
	if ($rootScope.activeMember.position.x <= 100) { memberZone='A'};
	if ($rootScope.activeMember.position.x >101 && $rootScope.activeMember.position.x <= 300) { memberZone='B'};
	if ($rootScope.activeMember.position.x >301 && $rootScope.activeMember.position.x <= 500) { memberZone='C'};
	if ($rootScope.activeMember.position.x >=501) { memberZone='D'};
}

var x_step=-100;
var y_step=150;

var z_step=0;
var z_spcr=250;

function membersMonitor(){

$rootScope.activeMember.__dirtyPosition=true;
	if ($rootScope.activeMember.position.x< -100) {xDir='positive';}
	if ($rootScope.activeMember.position.x> 700) {xDir='negative';}
	
	$rootScope.activeMember.position.x=x_step;
	$rootScope.activeMember.position.y=y_step;
	$rootScope.activeMember.position.z=Math.sin(z_step)*z_spcr;

	switch($scope.sessobj.level){
	  case 1:memberSteer(0.25, 0.025, 0.005, 0.05); break;
	  case 2:memberSteer(0.3, 0.03, 0.01, 0.06); break;
	  case 3:memberSteer(0.35, 0.035, 0.015, 0.07); break;
	  case 4:memberSteer(0.4, 0.04, 0.02, 0.08); break;
	  case 5:memberSteer(0.45, 0.045, 0.025, 0.09); break;
	  case 6:memberSteer(0.5, 0.05, 0.03, 0.1); break;
      case 7:memberSteer(0.55, 0.055, 0.095, 0.11); break;		  	
	}
};

HD_memberPlaneYZ=new THREE.Vector3();
HD_zeBallPlaneYZ=new THREE.Vector3();

function changeScore(){
	$scope.sessobj.hits=0;
	$scope.sessobj.level++;
	setLevel($scope.sessobj.level);
}


function hitDetector(){
	//15
	HD_memberPlaneYZ.set($rootScope.activeMember.position.x, 0, 0);
	HD_zeBallPlaneYZ.set($rootScope.ball.position.x, 0, 0);

	if (HD_zeBallPlaneYZ.distanceTo(HD_memberPlaneYZ)<20 && $scope.hittable) {
		$scope.hittable=false;

		if ($rootScope.activeMember.position.distanceTo($rootScope.ball.position)<75) {
			//this is a bulls eye
			$rootScope.activeMember.material.color.set('#33cd5f');

				switch(memberZone){
					case 'A':
						$scope.sessobj.score=$scope.sessobj.score+50;
					break;
					case 'B':
						$scope.sessobj.score=$scope.sessobj.score+100;
					break;
					case 'C':
						$scope.sessobj.score=$scope.sessobj.score+200;
					break;
					case 'D':
						$scope.sessobj.score=$scope.sessobj.score+400;
					break;
				}

			$scope.sessobj.hits++;
			if ($scope.sessobj.hits==4 || $scope.sessobj.hits==8 || $scope.sessobj.hits==12 || $scope.sessobj.hits==16) {
				

				//this is so that the user doesn't have a health num higher than 5
				if ($scope.sessobj.healthNum<5) {

						$scope.addLifeDisp=true;
						$scope.sessobj.healthNum++;
						$scope.sessobj.health=utilities.healthObjValue($scope.sessobj.healthNum);
				}
			};


			if ($scope.sessobj.hits>16) {

				switch($scope.sessobj.level){
					case 1: if ($scope.sessobj.score>1000) { changeScore();}; break;
					case 2: if ($scope.sessobj.score>2000) { changeScore();}; break;
					case 3: if ($scope.sessobj.score>3000) { changeScore();}; break;
					case 4: if ($scope.sessobj.score>4000) { changeScore();}; break;
					case 5: if ($scope.sessobj.score>5000) { changeScore();}; break;
					case 6: if ($scope.sessobj.score>6000) { changeScore();}; break;
					case 7:
						$scope.sessobj.inflatable=false;
						var sess_array=storageService.get('sess_array');
						sess_array.push($scope.sessobj);
			     		storageService.set('sess_array', sess_array);

					    $ionicLoading.show({
			              scope: $scope,
			              templateUrl: 'gameFinished.html' 
			            });
						pauseSession='on';
					break;
				}
			}

			$scope.$apply();
			$timeout(function(){
				$scope.hittable=true;
				$rootScope.activeMember.material.color.set('#fff');
				$scope.addLifeDisp=false;
			    $scope.$apply();},1000);
		}else{
			//this is a miss
			if ($scope.vibratos) {navigator.vibrate(200)};
			$rootScope.activeMember.material.color.set('#ef473a');
			if ($scope.sessobj.healthNum===1) {

				$scope.sessobj.healthNum--;
				$scope.sessobj.health=utilities.healthObjValue($scope.sessobj.healthNum);

				$scope.sessobj.inflatable=false;
				var sess_array=storageService.get('sess_array');
				sess_array.push($scope.sessobj);
	     		storageService.set('sess_array', sess_array);

			    $ionicLoading.show({
	              scope: $scope,
	              templateUrl: 'gameoverTemp.html' 
	            });
				pauseSession='on';
			}else{
				$scope.sessobj.healthNum--;
				$scope.sessobj.health=utilities.healthObjValue($scope.sessobj.healthNum);
				
			}

			
			$scope.$apply();
			$timeout(function(){
				$scope.hittable=true;
				$rootScope.activeMember.material.color.set('#fff');
				$scope.$apply();},1000);
		}		
	}
};

$scope.gameoverBtn=function(option){

	switch(option){
		case 'back':
			$state.go('app.home');
			$ionicLoading.hide();
			$rootScope.runAdverts();
		break;
		case 'playAgain':
			//serialize current sessobj (uninflatable)
			$scope.sessobj.inflatable=false;
			var sess_array=storageService.get('sess_array');
			sess_array.push($scope.sessobj);
     		storageService.set('sess_array', sess_array);

		    x_step=-100;
			y_step=150;
			z_step=0;
			z_spcr=250;

		    $rootScope.activeMember.position.x=-100;
		    $rootScope.activeMember.position.y=150;
		    $rootScope.activeMember.position.z=250;

			//init a new sessobj
			 $scope.restoreBall();
			 delete $scope.sessobj;
			 $scope.sessobj=new sesssFactory.session();
        	 $rootScope.renderer.compile($rootScope.scene, $rootScope.camera);
			 $rootScope.ball.setLinearVelocity(new THREE.Vector3(0,1,0));
			 setLevel($scope.sessobj.level);

			 $ionicLoading.hide();
			 pauseSession='off';

		break;
	};


}

$scope.statsVisible=function(){

	if ($scope.showStats) {
		$scope.showStats=false;
		return
	}

	$scope.showStats=true;
}

function freeze(){
	if (pauseSession==='off') {
		pauseSession='on';
		return;
	}

	pauseSession='off'
}

function animate(){
    requestID=undefined;

     try{  $rootScope.renderer.render($rootScope.scene, $rootScope.camera, null, true);
 
      }catch(err){
        pauseSession='on';
      	utilities.generalGlitch(err);
      };
  
    if (pauseSession==='off') {

      frameDelta +=clock.getDelta();
      while(frameDelta >= INV_MAX_FPS){
           
          zoneReader(); 
          ballMonitor();
          membersMonitor();
          hitDetector();

		  $rootScope.scene.simulate(INV_MAX_FPS, frameDelta); 
          frameDelta-= INV_MAX_FPS;
      };
          
           stats.update();
    };

    if (!requestID){requestID=$window.requestAnimationFrame(animate)};
  }; 

});

})();
