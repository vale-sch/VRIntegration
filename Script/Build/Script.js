"use strict";
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    f.Project.registerScriptNamespace(VRIntegration); // Register the namespace to FUDGE for serialization
    class CustomComponentScript extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = f.Component.registerSubclass(CustomComponentScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (f.Project.mode == f.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* COMPONENT_ADD */:
                    f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, this.update);
                    f.Loop.start();
                    break;
                case "componentRemove" /* COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
        hasToTurn = false;
        update = (_event) => {
            if (this.node.name != "FudgeLogo") {
                if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < 6.1 && !this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > 6)
                        this.hasToTurn = true;
                }
                else if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > -6.1 && this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(-2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < -6)
                        this.hasToTurn = false;
                }
            }
            else
                this.node.getComponent(f.ComponentTransform).mtxLocal.rotateY(0.1);
        };
    }
    VRIntegration.CustomComponentScript = CustomComponentScript;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    let xrViewport = new f.XRViewport();
    let graph = null;
    let cmpVRDevice = null;
    let rightController = null;
    let leftController = null;
    window.addEventListener("load", init);
    async function init() {
        await FudgeCore.Project.loadResources("Internal.json");
        graph = f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
        FudgeCore.Debug.log("Graph:", graph);
        if (!graph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        let canvas = document.querySelector("canvas");
        cmpVRDevice = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentVRDevice);
        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpVRDevice, canvas);
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];
        xrViewport.draw();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }
    // check device/browser capabilities for XR Session 
    function checkForVRSupport() {
        navigator.xr.isSessionSupported(f.XR_SESSION_MODE.IMMERSIVE_VR).then((supported) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }
    //main function to start XR Session
    function initializeVR() {
        //create XR Button -> Browser 
        let enterXRButton = document.createElement("button");
        enterXRButton.id = "xrButton";
        enterXRButton.innerHTML = "Enter VR";
        document.body.appendChild(enterXRButton);
        enterXRButton.addEventListener("click", async function () {
            //initalizes xr session 
            await xrViewport.initializeVR(f.XR_SESSION_MODE.IMMERSIVE_VR, f.XR_REFERENCE_SPACE.LOCAL, true);
            //stop normal loop of winodws.animationFrame
            f.Loop.stop();
            //set controllers matrix information to component transform from node controller made in FUDGE Editor
            rightController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal;
            leftController.getComponent(f.ComponentTransform).mtxLocal = xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal;
            //set controllers buttons events
            xrViewport.session.addEventListener("squeeze", onSqueeze);
            xrViewport.session.addEventListener("selectstart", onSelectStart);
            xrViewport.session.addEventListener("selectend", onSelectEnd);
            xrViewport.session.addEventListener("end", onEndSession);
            //starts xr-session.animationFrame instead of window.animationFrame, your xr-session is ready to go!
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
        });
    }
    let actualTeleportationObj = null;
    let actualThrowObject = null;
    let selectPressedRight = false;
    let selectPressedLeft = false;
    let hasHitThisFrameTeleObj = false;
    function update(_event) {
        hasHitThisFrameTeleObj = false;
        if (xrViewport.session) {
            let vecZCntrlR = xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal.getZ();
            this.rayHitInfoRight = FudgeCore.Physics.raycast(xrViewport.vrDevice.rightCntrl.cmpTransform.mtxLocal.translation, new FudgeCore.Vector3(-vecZCntrlR.x, -vecZCntrlR.y, -vecZCntrlR.z), 80, true);
            let vecZCntrlL = xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal.getZ();
            this.rayHitInfoLeft = FudgeCore.Physics.raycast(xrViewport.vrDevice.leftCntrl.cmpTransform.mtxLocal.translation, new FudgeCore.Vector3(-vecZCntrlL.x, -vecZCntrlL.y, -vecZCntrlL.z), 80, true);
            if (this.rayHitInfoRight)
                if (this.rayHitInfoRight.hit) {
                    if (this.rayHitInfoRight.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoRight.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = this.rayHitInfoRight.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (this.rayHitInfoRight.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoRight.rigidbodyComponent.node.name == "New Node") {
                        if (this.rayHitInfoRight.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = this.rayHitInfoRight.rigidbodyComponent.node;
                        actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                }
            if (this.rayHitInfoLeft)
                if (this.rayHitInfoLeft.hit) {
                    if (this.rayHitInfoLeft.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoLeft.rigidbodyComponent.node.name != "New Node") {
                        hasHitThisFrameTeleObj = true;
                        actualTeleportationObj = this.rayHitInfoLeft.rigidbodyComponent.node;
                        actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
                    }
                    if (this.rayHitInfoLeft.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && this.rayHitInfoLeft.rigidbodyComponent.node.name == "New Node") {
                        if (this.rayHitInfoLeft.rigidbodyComponent.node != actualThrowObject && actualThrowObject != null)
                            actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                        actualThrowObject = this.rayHitInfoLeft.rigidbodyComponent.node;
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
    }
    function onSqueeze(_event) {
        if (actualTeleportationObj) {
            xrViewport.vrDevice.position = actualTeleportationObj.getComponent(f.ComponentTransform).mtxLocal.translation;
            actualTeleportationObj.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualTeleportationObj = null;
        }
    }
    function onSelectStart(_event) {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                selectPressedRight = true;
            }
            if (_event.inputSource.handedness == "left") {
                selectPressedLeft = true;
            }
        }
    }
    function onSelectEnd(_event) {
        if (actualThrowObject) {
            if (_event.inputSource.handedness == "right") {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let velocity = f.Vector3.DIFFERENCE(rightController.mtxLocal.translation, xrViewport.camera.mtxWorld.translation);
                velocity.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(velocity);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedRight = false;
            }
            else {
                actualThrowObject.getComponent(f.ComponentRigidbody).setVelocity(f.Vector3.ZERO());
                let direction = f.Vector3.DIFFERENCE(leftController.mtxLocal.translation, xrViewport.camera.mtxWorld.translation);
                direction.scale(20);
                actualThrowObject.getComponent(f.ComponentRigidbody).addVelocity(direction);
                actualThrowObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualThrowObject = null;
                selectPressedLeft = false;
            }
        }
    }
    function onEndSession() {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map