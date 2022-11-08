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
            this.addEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* f.EVENT.COMPONENT_ADD */:
                    f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, this.update);
                    f.Loop.start();
                    break;
                case "componentRemove" /* f.EVENT.COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
        hasToTurn = false;
        update = (_event) => {
            if (this.node.name != "FudgeLogo") {
                if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < 15.1 && !this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > 15)
                        this.hasToTurn = true;
                }
                else if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x > -15.1 && this.hasToTurn) {
                    this.node.getComponent(f.ComponentRigidbody).applyForce(f.Vector3.X(-2.2));
                    if (this.node.getComponent(f.ComponentTransform).mtxLocal.translation.x < -15)
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
    f.Project.registerScriptNamespace(VRIntegration); // Register the namespace to FUDGE for serialization
    class RandomSphereSpawn extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = f.Component.registerSubclass(RandomSphereSpawn);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (f.Project.mode == f.MODE.EDITOR)
                return;
            // Listen to this component being added to or removed from a node
            this.addEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
            this.addEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
            this.addEventListener("nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */, this.hndEvent);
        }
        // Activate the functions of this component as response to events
        hndEvent = (_event) => {
            switch (_event.type) {
                case "componentAdd" /* f.EVENT.COMPONENT_ADD */:
                    this.node.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(f.random.getRange(0, 1), f.random.getRange(0, 1), f.random.getRange(0, 1), 1);
                    break;
                case "componentRemove" /* f.EVENT.COMPONENT_REMOVE */:
                    this.removeEventListener("componentAdd" /* f.EVENT.COMPONENT_ADD */, this.hndEvent);
                    this.removeEventListener("componentRemove" /* f.EVENT.COMPONENT_REMOVE */, this.hndEvent);
                    break;
                case "nodeDeserialized" /* f.EVENT.NODE_DESERIALIZED */:
                    // if deserialized the node is now fully reconstructed and access to all its components and children is possible
                    break;
            }
        };
    }
    VRIntegration.RandomSphereSpawn = RandomSphereSpawn;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    let xrViewport = new f.XRViewport();
    let graph = null;
    let cmpCamera = null;
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
        cmpCamera = graph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
        xrViewport.physicsDebugMode = f.PHYSICS_DEBUGMODE.JOINTS_AND_COLLIDER;
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        xrViewport.draw();
        rightController = graph.getChildrenByName("rightController")[0];
        leftController = graph.getChildrenByName("leftController")[0];
        f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }
    let actualHittedObject = null;
    function update(_event) {
        rightController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.rightController.mtxLocal;
        leftController.getComponent(f.ComponentTransform).mtxLocal = f.XRViewport.leftController.mtxLocal;
        let vecZRightCntrl = f.XRViewport.rightController.mtxLocal.getZ();
        let rayHitR = f.Physics.raycast(f.XRViewport.rightController.mtxLocal.translation, new f.Vector3(-vecZRightCntrl.x, -vecZRightCntrl.y, -vecZRightCntrl.z), 80, true);
        if (rayHitR.hit) {
            if (rayHitR.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitR.rigidbodyComponent.node.name != "New Node") {
                if (rayHitR.rigidbodyComponent.node != actualHittedObject && actualHittedObject != null)
                    actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualHittedObject = rayHitR.rigidbodyComponent.node;
                actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
            }
        }
        let vecZLeftCntrl = f.XRViewport.leftController.mtxLocal.getZ();
        let rayHitL = f.Physics.raycast(f.XRViewport.leftController.mtxLocal.translation, new f.Vector3(-vecZLeftCntrl.x, -vecZLeftCntrl.y, -vecZLeftCntrl.z), 80, true);
        if (rayHitL.hit) {
            if (rayHitL.rigidbodyComponent.typeBody != f.BODY_TYPE.STATIC && rayHitL.rigidbodyComponent.node.name != "New Node") {
                if (rayHitL.rigidbodyComponent.node != actualHittedObject && actualHittedObject != null)
                    actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
                actualHittedObject = rayHitL.rigidbodyComponent.node;
                actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 1;
            }
        }
        f.Physics.simulate();
        xrViewport.draw();
    }
    function checkForVRSupport() {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
            if (supported)
                initializeVR();
            else
                console.log("Session not supported");
        });
    }
    function initializeVR() {
        let enterXRButton = document.createElement("button");
        enterXRButton.id = "xrButton";
        enterXRButton.innerHTML = "Enter VR";
        document.body.appendChild(enterXRButton);
        enterXRButton.addEventListener("click", async function () {
            await f.Render.initializeXR("immersive-vr", "local");
            f.Loop.stop();
            f.XRViewport.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
            f.XRViewport.xrSession.addEventListener("squeeze", onSqueeze);
            f.XRViewport.xrSession.addEventListener("select", onSelect);
            f.XRViewport.xrSession.addEventListener("end", onEndSession);
        });
    }
    function onSqueeze() {
        console.log("SQUEEZED");
        if (actualHittedObject != null) {
            f.XRViewport.setNewXRRigidtransform(f.Vector3.DIFFERENCE(cmpCamera.mtxWorld.translation, actualHittedObject.getComponent(f.ComponentTransform).mtxLocal.translation));
            actualHittedObject.getComponent(f.ComponentMaterial).clrPrimary.a = 0.5;
            actualHittedObject = null;
        }
    }
    async function onSelect() {
        let sphere = await f.Project.createGraphInstance(f.Project.resources["Graph|2022-10-26T13:26:47.063Z|65923"]);
        graph.appendChild(sphere);
    }
    function onEndSession() {
        f.Loop.stop();
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
    }
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map