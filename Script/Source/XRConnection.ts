
namespace VRIntegration {
    import f = FudgeCore;
    let xrViewport: f.XRViewport = new f.XRViewport;
    window.addEventListener("load", init);
    export let graph: f.Graph = null;
    export let cmpCamera: f.ComponentCamera = null;
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
        xrViewport.initialize("Viewport", graph, cmpCamera, canvas, true);
        xrViewport.draw();

        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start();
    }

    function update(_event: Event): void {
        // f.Physics.simulate()
        // f.Physics.simulate();  // if physics is included and used
        xrViewport.draw();
        //f.AudioManager.default.update();
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
}

