pointOfOrder.factory('storageService', function($rootScope){

    return{

        set:function(key,value){
        	var freshObj=angular.toJson(value);
            return localStorage.setItem(key,freshObj);
        },
        get:function(key){        			
            return  angular.fromJson(localStorage.getItem(key));
        },
        destroy:function(key){
            return localStorage.removeItem(key);
        }
    };
});

pointOfOrder.factory('utilities', function($rootScope,  $ionicLoading){
  return{

    showCamContents: function (object){
    
    var frustum = new THREE.Frustum();
    var cameraViewProjectionMatrix = new THREE.Matrix4();
    var isItVisible=false;
    // every time the camera or objects change position (or every frame)

    $rootScope.camera.updateMatrixWorld(); // make sure the camera matrix is updated
    $rootScope.camera.matrixWorldInverse.getInverse( $rootScope.camera.matrixWorld );
    cameraViewProjectionMatrix.multiplyMatrices( $rootScope.camera.projectionMatrix, $rootScope.camera.matrixWorldInverse );
    frustum.setFromMatrix( cameraViewProjectionMatrix );

    // frustum is now ready to check all the objects we need
    isItVisible=frustum.intersectsObject(object);
    return isItVisible; 
  },

     arrMaxMin: function(fn, array){

      var val;

        switch(fn){
            case 'max':
              val = Math.max.apply(Math, array);
            break;
            case 'min':
              val = Math.min.apply(Math, array);
            break;
        };

        return val;
   },


     generalGlitch: function(err, pauseSession){
    
       $ionicLoading.show({
              scope: $rootScope,
              template: `<div align="center" >
                            <div class="item item-thumbnail-left" style="background-color: transparent; padding-top: 20px;">
                              <img src="img/stopNosonso.png">
                                <h4 style="text-align: center; color: white;">  
                                     Woops, looks like Point of order hit a serious snag.<br>
                                     You're gonna have to reset the app...<br>
                                     Sorry for the inconvenience...                                
                                </h4>
                            </div><br>
                              <p class="confBtn" ng-click="ContextLost_btn()">Reset</p>
                          </div>
                        `   
            });
    },

    generalLoadProg: function(progress){
        // console.log(progress);
    },

    healthObjValue: function(num){

      switch(num){

        case 0: return {h1:false, h2:false, h3:false, h4:false, h5:false}; break;
        case 1: return {h1:true, h2:false, h3:false, h4:false, h5:false}; break;
        case 2: return {h1:true, h2:true, h3:false, h4:false, h5:false}; break;
        case 3: return {h1:true, h2:true, h3:true, h4:false, h5:false}; break;
        case 4: return {h1:true, h2:true, h3:true, h4:true, h5:false}; break;
        case 5: return {h1:true, h2:true, h3:true, h4:true, h5:true}; break;        
      };

  },

  healthNumValue: function(healthObj){

      var state=null;

      if (healthObj.h1===true && healthObj.h2===true && healthObj.h3===true && healthObj.h4===true && healthObj.h5===true) {return state=5;};
      if (healthObj.h1===true && healthObj.h2===true && healthObj.h3===true && healthObj.h4===true && healthObj.h5===false) { return state=4;};
      if (healthObj.h1===true && healthObj.h2===true && healthObj.h3===true && healthObj.h4===false && healthObj.h5===false) { return state=3;};
      if (healthObj.h1===true && healthObj.h2===true && healthObj.h3===false && healthObj.h4===false && healthObj.h5===false) { return state=2;};
      if (healthObj.h1===true && healthObj.h2===false && healthObj.h3===false && healthObj.h4===false && healthObj.h5===false) { return state=1;};
      if (healthObj.h1===false && healthObj.h2===false && healthObj.h3===false && healthObj.h4===false && healthObj.h5===false) { return state=0;};

  }
   }
});

pointOfOrder.factory('worlds', function($document, $rootScope, $window, utilities, $timeout, utilities, $http, $state, $ionicLoading, $ionicPopup){

    return{
     setupContext: function(){

        function webglAvailable() {
          try {
            var canvas = document.createElement( 'canvas' );
            return !!( window.WebGLRenderingContext && (
              canvas.getContext( 'webgl' ) ||
              canvas.getContext( 'experimental-webgl' ) )
            );
          } catch ( e ) {
            return false;
          }
        }

          if ( webglAvailable() ) {
              
              $rootScope.renderer = new THREE.WebGLRenderer({ antialias: true });

            } else {

              $rootScope.renderer = new THREE.CanvasRenderer({ antialias: true });
              
          }

        $rootScope.scene = new Physijs.Scene();

        $rootScope.renderer.setClearColor( 0x333333 );
        $rootScope.renderer.setPixelRatio( $window.devicePixelRatio );
        $rootScope.renderer.setSize($window.innerWidth/1.5,$window.innerHeight/1.5);
        $rootScope.renderer.autoClear=true;

        //this is the guy that stretches the renderer throughout the screen regardless of its size (the size is given by the lines above);
        $rootScope.renderer.domElement.style.cssText='position: fixed; width:'+$window.innerWidth+'px; height:'+$window.innerHeight+'px; top:0; left:0; z-index: -500;';

        $rootScope.scene.setGravity(new THREE.Vector3( 0, -250, 0 ));

        $rootScope.camera = new THREE.PerspectiveCamera(60, $window.innerWidth/$window.innerHeight, 0.01, 3000 );

        $rootScope.camera.position.x=-1100;
        $rootScope.camera.position.y=110;
        $rootScope.camera.position.z=0;
        $rootScope.camera.lookAt(new THREE.Vector3(0,200,0));

      //the code below is for development purposes only and should not be taken seriously.

        // var axis=new THREE.AxisHelper(500);
        // $rootScope.scene.add(axis);

    },

    createClouds: function(){

        var cloudLoader=new THREE.CubeTextureLoader(THREE.DefaultLoadingManager);
        var ext='.png';

        cloudLoader.setPath( 'img/clouds/' );
        cloudLoader.load([ 'px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], function(res){
        res.minFilter=THREE.NearestFilter;
        $rootScope.scene.background=res;
        
      },utilities.generalLoadProg, utilities.generalGlitch);  
       
    },

  createFieldUtils: function(){

  var dirLight=new THREE.DirectionalLight(0xffffff, 1, 100);
      dirLight.position.x=-1100;
      dirLight.position.y=1100;
      dirLight.position.z=100;
  //     dirLight.castShadow=true;

  //     dirLight.shadow.mapSize.width=2048;
  //     dirLight.shadow.mapSize.height=2048;

  //     dirLight.shadow.camera.near=0.01;
  //     dirLight.shadow.camera.far=1000;

  //     dirLight.lookAt(new THREE.Vector3());

// console.log(dirLight.shadow);
  $rootScope.scene.add(dirLight);

  var groundTxtLoader=new THREE.TextureLoader();
      groundTxtLoader.load('img/grassField.jpg', function(groenGrass){

        groenGrass.wrapT=groenGrass.wrapS=THREE.RepeatWrapping;
        groenGrass.repeat.set(20,20);
//
        var ground_material = Physijs.createMaterial(new THREE.MeshBasicMaterial({ map: groenGrass, color: 0xcccccc}),0.5,0.2);
        var ground= new Physijs.PlaneMesh(new THREE.PlaneGeometry(4000,4000), ground_material, 0);

        ground.rotation.x=-Math.PI/2;

        ground.onBeforeRender=function(){this.material.needsUpdate=true;};
        ground.onAfterRender=function(){this.onBeforeRender=function(){}};

        $rootScope.scene.add(ground);
      
        groundTxtLoader.load('img/ball (2).png', function(ballTexture){
            var ballMaterial=Physijs.createMaterial(new THREE.MeshLambertMaterial({map: ballTexture}), 1, 2.5);

            $rootScope.ball=new Physijs.SphereMesh(new THREE.SphereBufferGeometry(13,32 , 32), ballMaterial, 0.2);
            $rootScope.scene.add($rootScope.ball);

            (new THREE.JSONLoader).load('templates/activeMember.json', function(res){

           var memMat=new THREE.MeshLambertMaterial({color: '#fff'});
               $rootScope.activeMember=new THREE.Mesh(res, memMat);
               $rootScope.activeMember.rotation.y=Math.PI;

               $rootScope.activeMember.position.x=-100;
               $rootScope.activeMember.position.y=150;
               $rootScope.activeMember.position.z=250;
               $rootScope.scene.add($rootScope.activeMember);

            },utilities.generalLoadProg, utilities.generalGlitch);
        },utilities.generalLoadProg, utilities.generalGlitch);
      },utilities.generalLoadProg, utilities.generalGlitch);
    }  
  }
});

pointOfOrder.factory('sesssFactory', function($rootScope){
  return{

          session: function(){

              /*session's game details*/
              this.sessID=Date.now()+Math.floor(Math.random()*100);
              this.score=0;
              this.hits=0;
              this.level=1;
              this.healthNum=5;
              this.health={ h1: true, h2: true, h3: true, h4: true, h5: true};
              this.inflatable=true;
        }
    }
});