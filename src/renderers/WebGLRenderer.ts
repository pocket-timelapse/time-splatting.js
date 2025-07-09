import type { Scene } from "../core/Scene";
import { FadeInPass } from "./webgl/passes/FadeInPass";
import { Camera } from "../cameras/Camera";
import { Color32 } from "../math/Color32";
import { ShaderProgram } from "./webgl/programs/ShaderProgram";
import { RenderProgram } from "./webgl/programs/RenderProgram";
import { ShaderPass } from "./webgl/passes/ShaderPass";

export class WebGLRenderer {
    private _canvas: HTMLCanvasElement;
    private _gl: WebGL2RenderingContext;
    private _backgroundColor: Color32 = new Color32();
    private _renderProgram: RenderProgram;
    private _programs: ShaderProgram[];

    addProgram: (program: ShaderProgram) => void;
    removeProgram: (program: ShaderProgram) => void;
    resize: () => void;
    setSize: (width: number, height: number) => void;
    render: (scene: Scene, camera: Camera) => void;
    render_intrinsic: (albedo_scene: Scene, shading_scene: Scene, camera: Camera) => void;
    dispose: () => void;

    constructor(optionalCanvas: HTMLCanvasElement | null = null, optionalRenderPasses: ShaderPass[] | null = null) {
        const canvas: HTMLCanvasElement = optionalCanvas || document.createElement("canvas");
        if (!optionalCanvas) {
            canvas.style.display = "block";
            canvas.style.boxSizing = "border-box";
            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.margin = "0";
            canvas.style.padding = "0";
            document.body.appendChild(canvas);
        }
        canvas.style.background = this._backgroundColor.toHexString();
        this._canvas = canvas;

        this._gl = canvas.getContext("webgl2", { antialias: false }) as WebGL2RenderingContext;

        const renderPasses = optionalRenderPasses || [];
        if (!optionalRenderPasses) {
            renderPasses.push(new FadeInPass());
        }

        this._renderProgram = new RenderProgram(this, renderPasses);
        this._programs = [this._renderProgram] as ShaderProgram[];

        this.resize = () => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width || canvas.height !== height) {
                this.setSize(width, height);
            }
        };

        this.setSize = (width: number, height: number) => {
            canvas.width = width;
            canvas.height = height;
            this._gl.viewport(0, 0, canvas.width, canvas.height);
            for (const program of this._programs) {
                program.resize();
            }
        };

        this.render = (scene: Scene, camera: Camera) => {
            for (const program of this._programs) {
                program.render(scene, camera);
            }
        };

        this.render_intrinsic = (albedo_scene: Scene, shading_scene: Scene, camera: Camera) => {
            this._programs[0].render(albedo_scene, camera);
            this._programs[1].render(shading_scene, camera);
            this._programs[2].render(albedo_scene, camera);
        };

        this.dispose = () => {
            for (const program of this._programs) {
                program.dispose();
            }
        };

        this.addProgram = (program: ShaderProgram) => {
            this._programs.push(program);
        };

        this.removeProgram = (program: ShaderProgram) => {
            const index = this._programs.indexOf(program);
            if (index < 0) {
                throw new Error("Program not found");
            }
            this._programs.splice(index, 1);
        };

        this.resize();
    }

    get canvas() {
        return this._canvas;
    }

    get gl() {
        return this._gl;
    }

    get renderProgram() {
        return this._renderProgram;
    }

    get albedoProgram() {
        return this._programs[0] as RenderProgram;
    }

    get shadingProgram() {
        return this._programs[1] as RenderProgram;
    }

    get backgroundColor() {
        return this._backgroundColor;
    }

    set backgroundColor(value: Color32) {
        this._backgroundColor = value;
        this._canvas.style.background = value.toHexString();
    }
}
