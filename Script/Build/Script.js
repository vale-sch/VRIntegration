"use strict";
var Script;
(function (Script) {
    var ƒ = FudgeCore;
    ƒ.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class CustomComponentScript extends ƒ.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = ƒ.Component.registerSubclass(CustomComponentScript);
        // Properties may be mutated by users in the editor via the automatically created user interface
        message = "CustomComponentScript added to ";
        constructor() {
            super();
            // Don't start when running in editor
            if (ƒ.Project.mode == ƒ.MODE.EDITOR)
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
                    ƒ.Debug.log(this.message, this.node);
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
    }
    Script.CustomComponentScript = CustomComponentScript;
})(Script || (Script = {}));
var Script;
(function (Script) {
    var f = FudgeCore;
    f.Debug.info("Main Program Template running!");
    let xrViewport = new f.XRViewport();
    let graph = null;
    let cmpCamera = null;
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
        cmpCamera.clrBackground = f.Color.CSS("lightsteelblue", 0.25);
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas);
        xrViewport.draw();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
        checkForVRSupport();
    }
    // check device/browser capabilities for XR Session 
    function checkForVRSupport() {
        navigator.xr.isSessionSupported("immersive-vr").then((supported) => {
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
            await xrViewport.initializeVR("immersive-vr", "local", true);
            //initializeRays();
            //stop normal loop of winodws.animationFrame
            f.Loop.stop();
            //set xr transform to matrix from ComponentCamera -> xr transform = camera transform
            xrViewport.vr.setNewXRRigidtransform(f.Vector3.DIFFERENCE(f.Vector3.ZERO(), cmpCamera.mtxWorld.translation));
            //start xrSession.animationFrame instead of window.animationFrame, your xr-session is ready to go!
            f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
        });
    }
    function initializeRays() {
        let pickableObjects = graph.getChildrenByName("CubeContainer")[0].getChildren();
        let rightRayNode = graph.getChildrenByName("raysContainer")[0].getChild(0);
        let leftRayNode = graph.getChildrenByName("raysContainer")[0].getChild(1);
        rightRayNode.addComponent(new Script.RayHelper(xrViewport, xrViewport.vr.rightController, 50, pickableObjects));
        leftRayNode.addComponent(new Script.RayHelper(xrViewport, xrViewport.vr.leftController, 50, pickableObjects));
    }
    function update(_event) {
        let pickableObjects = graph.getChildrenByName("CubeContainer")[0].getChildren();
        let ray = new f.Ray(new f.Vector3(0, 0, 1), new f.Vector3(1, 0, -1), 0.1);
        let picker = f.Picker.pickRay(pickableObjects, ray, 0, 100000000000000000);
        // console.log(picker.length);
        xrViewport.draw();
    }
})(Script || (Script = {}));
var Script;
(function (Script) {
    var f = FudgeCore;
    f.Project.registerScriptNamespace(Script); // Register the namespace to FUDGE for serialization
    class RayHelper extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        //  public static readonly iSubclass: number = f.Component.registerSubclass(RayHelper);
        // Properties may be mutated by users in the editor via the automatically created user interface
        xrViewport = null;
        controllerTransform;
        maxLength;
        pickableObjects;
        pick = null;
        constructor(_xrViewport, _controllerTransform, _lengthRay, _pickableObjects) {
            super();
            this.xrViewport = _xrViewport;
            this.controllerTransform = _controllerTransform;
            this.maxLength = _lengthRay;
            this.pickableObjects = _pickableObjects;
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
                    f.Loop.start(f.LOOP_MODE.FRAME_REQUEST);
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
        computeRay = (_webXRControllerTransform, rayNode) => {
            rayNode.getComponent(f.ComponentTransform).mtxLocal = _webXRControllerTransform.mtxLocal;
            let forward;
            forward = f.Vector3.Z();
            forward.transform(rayNode.mtxWorld, false);
            let ray = new f.Ray(new f.Vector3(0, 0, -1), new f.Vector3(2, 0, 1), 0.1);
            // let ray: f.Ray = new f.Ray(new f.Vector3(forward.x * 10000, forward.y * 10000, forward.z * 10000), rayNode.mtxLocal.translation, 0.1);
            if (!this.pick) {
                rayNode.getComponent(f.ComponentMesh).mtxPivot.scaling = new f.Vector3(0.1, this.maxLength, 0.1);
                rayNode.getComponent(f.ComponentMesh).mtxPivot.translation = new f.Vector3(0, 0, -this.maxLength / 2);
            }
            else {
                let distance = ray.getDistance(this.pick.mtxLocal.translation);
                rayNode.getComponent(f.ComponentMesh).mtxPivot.scaling = new f.Vector3(0.1, distance.magnitude, 0.1);
                console.log(rayNode.mtxLocal.translation);
                rayNode.getComponent(f.ComponentMesh).mtxPivot.translation = new f.Vector3(0, 0, -distance.magnitude / 2);
            }
            let picker = f.Picker.pickRay(this.pickableObjects, ray, 0, 100000000000000000);
            picker.sort((a, b) => a.zBuffer < b.zBuffer ? -1 : 1);
            picker.forEach(element => {
                console.log(element.node.name);
            });
            if (picker.length > 0) {
                this.pick = picker[0].node;
            }
            else
                this.pick = null;
        };
        update = () => {
            if (this.xrViewport.vr.xrSession)
                this.computeRay(this.controllerTransform, this.node);
        };
    }
    Script.RayHelper = RayHelper;
})(Script || (Script = {}));
//# sourceMappingURL=Script.js.map