
namespace VRIntegration {
    import f = FudgeCore;

    let xrViewport: f.XRViewport = new f.XRViewport();
    let graph: f.Graph = null;
    let cmpCamera: f.ComponentCamera = null;
    let rightController: f.Node = null;
    let leftController: f.Node = null;
    window.addEventListener("load", init);

    async function init() {
        await FudgeCore.Project.loadResources("Internal.json");
        graph = <f.Graph>f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
        FudgeCore.Debug.log("Graph:", graph);
        if (!graph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("canvas");
        cmpCamera = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
        setupAudio();

        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];

        xrViewport.draw();
        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);

        checkForVRSupport();
    }

    function setupAudio(): void {
        let cmpListener: f.ComponentAudioListener = new f.ComponentAudioListener();
        cmpCamera.node.addComponent(cmpListener);
        f.AudioManager.default.listenTo(graph);
        f.AudioManager.default.listenWith(cmpCamera.node.getComponent(f.ComponentAudioListener));
    }
    // check device/browser capabilities for XR Session 
    function checkForVRSupport(): void {
        navigator.xr.isSessionSupported("immersive-vr").then((supported: boolean) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }
    //main function to start XR Session
    function initializeVR(): void {
        //create XR Button -> Browser 
        let enterXRButton: HTMLButtonElement = document.createElement("button");
        enterXRButton.id = "xrButton";
        enterXRButton.innerHTML = "Enter VR";
        document.body.appendChild(enterXRButton);

        enterXRButton.addEventListener("click", async function () {
            //initalizes xr session 
            await xrViewport.initializeXR("immersive-vr", "local", true);

            //stop normal loop of winodws.animationFrame
            f.Loop.stop();

            //set controllers matrix information to component transform from node controller made in FUDGE Editor
            rightController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.xr.rightController.mtxLocal;
            leftController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.xr.leftController.mtxLocal;
            xrViewport.xr.leftController.isRayHitInfo = true;
            xrViewport.xr.rightController.isRayHitInfo = true;
            //set controllers buttons events
            xrViewport.xr.xrSession.addEventListener("squeeze", onSqueeze);
            xrViewport.xr.xrSession.addEventListener("selectstart", onSelectStart);
            xrViewport.xr.xrSession.addEventListener("selectend", onSelectEnd);
            xrViewport.xr.xrSession.addEventListener("end", onEndSession);

            //set xr transform to matrix from ComponentCamera -> xr transform = camera transform
            xrViewport.xr.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
            //start xrSession.animationFrame instead of window.animationFrame, your xr-session is ready to go!
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
        }
        );
    }






    let actualTeleportationObj: f.Node = null;
    let actualThrowObject: f.Node = null;
    let selectPressedRight: boolean = false;
    let selectPressedLeft: boolean = false;
    let hasHitThisFrameTeleObj: boolean = false;

    function update(_event: Event): void {
        hasHitThisFrameTeleObj = false;
        if (xrViewport.xr.xrSession) {



            if (xrViewport.xr.rightController.rayHit)
                if (xrViewport.xr.rightController.rayHit.hit) {
                    if (xrViewport.xr.rightController.rayHit.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && xrViewport.xr.rightController.rayHit.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = xrViewport.xr.rightController.rayHit.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (xrViewport.xr.rightController.rayHit.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && xrViewport.xr.rightController.rayHit.rigidbodyComponent.node.name == "New Node") {
                        if (xrViewport.xr.rightController.rayHit.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = xrViewport.xr.rightController.rayHit.rigidbodyComponent.node;
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                }
            if (xrViewport.xr.leftController.rayHit)
                if (xrViewport.xr.leftController.rayHit.hit) {
                    if (xrViewport.xr.leftController.rayHit.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && xrViewport.xr.leftController.rayHit.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = xrViewport.xr.leftController.rayHit.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (xrViewport.xr.leftController.rayHit.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && xrViewport.xr.leftController.rayHit.rigidbodyComponent.node.name == "New Node") {
                        if (xrViewport.xr.leftController.rayHit.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = xrViewport.xr.leftController.rayHit.rigidbodyComponent.node;
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;

                    }
                }


            if (!hasHitThisFrameTeleObj && actualTeleportationObj != null) {
                actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualTeleportationObj = null;
            }


            if (actualThrowObject != null) {
                if (selectPressedLeft) {
                    actualThrowObject.getComponent(f.ComponentRigidbody).setPosition(leftController.mtxWorld.translation);
                }
                if (selectPressedRight) {
                    actualThrowObject.getComponent(f.ComponentRigidbody).setPosition(rightController.mtxWorld.translation);
                }
            }
        }


        f.Physics.simulate();
        xrViewport.draw();
        f.AudioManager.default.update();

    }

    function onSqueeze(_event: XRInputSourceEvent): void {
        if (actualTeleportationObj) {
            let newPos: f.Vector3 = f.Vector3.DIFFERENCE(cmpCamera.mtxWorld.translation, actualTeleportationObj.getComponent(f.ComponentTransform).mtxLocal.translation);
            newPos.y -= 0.5;
            xrViewport.xr.setNewXRRigidtransform(newPos);
            actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualTeleportationObj = null;
        }
    }

    function onSelectStart(_event: XRInputSourceEvent): void {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                selectPressedRight = true;
            }
            if (_event.inputSource.handedness == "left") {
                selectPressedLeft = true;
            }
        }
    }

    function onSelectEnd(_event: XRInputSourceEvent): void {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let velocity: f.Vector3 = f.Vector3.DIFFERENCE(rightController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                velocity.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(velocity);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedRight = false;
            } else {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let direction: f.Vector3 = f.Vector3.DIFFERENCE(leftController.mtxLocal.translation, cmpCamera.mtxPivot.translation);
                direction.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(direction);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedLeft = false;
            }
        }

    }

    function onEndSession(): void {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
}

