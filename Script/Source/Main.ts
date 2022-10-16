namespace VRIntegration {
    window.addEventListener("load", checkForSupport);

    function checkForSupport(): void {
        let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.querySelector("canvas");
        new XRConnection(canvas, null);
    }
}

