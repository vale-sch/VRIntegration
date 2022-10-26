"use strict";
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    f.Project.registerScriptNamespace(VRIntegration); // Register the namespace to FUDGE for serialization
    class CubeTranslation extends f.ComponentScript {
        // Register the script as component for use in the editor via drag&drop
        static iSubclass = f.Component.registerSubclass(CubeTranslation);
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
                    this.node.getComponent(f.ComponentTransform).mtxLocal.translation = new f.Vector3(f.random.getRange(-10, 10), -0.25, f.random.getRange(0, -10));
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
    VRIntegration.CubeTranslation = CubeTranslation;
})(VRIntegration || (VRIntegration = {}));
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
        hasSetted = false;
        update = (_event) => {
            this.node.getComponent(f.ComponentTransform).mtxLocal.rotateY(0.1);
            if (this.hasSetted)
                return;
            if (this.node.nChildren > 0 && this.node.name != "FudgeLogo")
                this.node.getChildren().forEach(element => {
                    if (element.getComponent(f.ComponentMaterial))
                        element.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(f.random.getRange(0, 1), f.random.getRange(0, 1), f.random.getRange(0, 1), 1);
                    element.getChildren().forEach(element => {
                        if (element.getComponent(f.ComponentMaterial))
                            element.getComponent(f.ComponentMaterial).clrPrimary = new f.Color(f.random.getRange(0, 1), f.random.getRange(0, 1), f.random.getRange(0, 1), 1);
                    });
                    this.hasSetted = true;
                });
        };
    }
    VRIntegration.CustomComponentScript = CustomComponentScript;
})(VRIntegration || (VRIntegration = {}));
var VRIntegration;
(function (VRIntegration) {
    var f = FudgeCore;
    let xrViewport = new f.XRViewport;
    window.addEventListener("load", init);
    async function init() {
        await FudgeCore.Project.loadResources("Internal.json");
        let madeMazeGraph = f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];
        FudgeCore.Debug.log("Graph:", madeMazeGraph);
        if (!madeMazeGraph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }
        let canvas = document.querySelector("canvas");
        let cmpCamera = madeMazeGraph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
        //cmpCamera.mtxPivot.rotateX(90);
        // cmpCamera.mtxPivot.translateY(10);
        xrViewport.initialize("Viewport", madeMazeGraph, cmpCamera, canvas, true);
        // this.gl = this.glCanvas.getContext("webgl2");
        xrViewport.draw();
        f.Loop.addEventListener("loopFrame" /* f.EVENT.LOOP_FRAME */, update);
        //import change for XR SESSION
        f.Loop.start(f.LOOP_MODE.FRAME_REQUEST_XR);
    }
    function update(_event) {
        xrViewport.draw();
    }
    /*
 
      //call this method if you want to end the immersive session
      //@ts-ignore
      private endXRSession(): void {
          // Do we have an active session?
          if (this.xrSession) {
              // End the XR session now.
              this.xrSession.end().then(this.onSessionEnd);
          }
      }
 
      // Restore the page to normal after an immersive session has ended.
      private onSessionEnd() {
          this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
 
          this.xrSession = null;
 
          // Ending the session stops executing callbacks passed to the XRSession's
          // requestAnimationFrame(). To continue rendering, use the window's
          // requestAnimationFrame() function.
          // window.requestAnimationFrame(onDrawFrame);
      }*/
})(VRIntegration || (VRIntegration = {}));
//# sourceMappingURL=Script.js.map