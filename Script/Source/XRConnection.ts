
namespace VRIntegration {
    import f = FudgeCore;
    let xrViewport: f.XRViewport = new f.XRViewport;
    window.addEventListener("load", init);

    async function init() {
        await FudgeCore.Project.loadResources("Internal.json");
        let madeMazeGraph = <f.Graph>f.Project.resources[document.head.querySelector("meta[autoView]").getAttribute("autoView")];

        FudgeCore.Debug.log("Graph:", madeMazeGraph);
        if (!madeMazeGraph) {
            alert("Nothing to render. Create a graph with at least a mesh, material and probably some light");
            return;
        }

        let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("canvas");
        let cmpCamera = madeMazeGraph.getChildrenByName("Camera")[0].getComponent(f.ComponentCamera);
        xrViewport.initialize("Viewport", madeMazeGraph, cmpCamera, canvas, true);
        xrViewport.draw();
        f.Loop.addEventListener(f.EVENT.LOOP_FRAME, update);
        f.Loop.start();
    }

    function update(_event: Event): void {
        // ƒ.Physics.simulate();  // if physics is included and used
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

