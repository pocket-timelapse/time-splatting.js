import { ShaderProgram } from "./ShaderProgram";
import { WebGLRenderer } from "../../WebGLRenderer";
import { ShaderPass } from "../passes/ShaderPass";

const vertexShaderSource = /* glsl */ `#version 300 es
precision highp float;
precision highp int;

in vec2 position;
out vec2 vPosition;

void main() {
    vPosition = (position + 1.0) * 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderSource = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_albedo;
uniform sampler2D u_shading;

in vec2 vPosition;
out vec4 fragColor;

void main(){
    vec4 albedo = texture(u_albedo, vPosition);
    vec4 shading = texture(u_shading, vPosition);


    fragColor = vec4(albedo.rgb * shading.rgb, 1.0);
}
`;

class IntrinsicImageProgram extends ShaderProgram {
    protected _initialize: () => void;
    protected _resize: () => void;
    protected _render: () => void;
    protected _dispose: () => void;

    constructor(renderer: WebGLRenderer, passes: ShaderPass[]) {
        super(renderer, passes);

        const gl = renderer.gl;

        let u_albedo: WebGLUniformLocation;
        let u_shading: WebGLUniformLocation;

        let quadBuffer: WebGLBuffer;

        let positionAttribute: number;

        this._resize = () => {};

        this._initialize = () => {
            // Create fullscreen quad
            const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
            quadBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            positionAttribute = gl.getAttribLocation(this.program, "position");
            gl.enableVertexAttribArray(positionAttribute);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

            u_albedo = gl.getUniformLocation(this.program, "u_albedo") as WebGLUniformLocation;
            u_shading = gl.getUniformLocation(this.program, "u_shading") as WebGLUniformLocation;
        };

        this._render = () => {
            const albedoProgram = this.renderer.albedoProgram;
            const shadingProgram = this.renderer.shadingProgram;

            if (!albedoProgram.renderData || !shadingProgram.renderData) {
                console.error("Cannot render without scene");
                return;
            }

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, albedoProgram.splatTexture);
            gl.uniform1i(u_albedo, 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, shadingProgram.splatTexture);
            gl.uniform1i(u_shading, 1);

            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.BLEND);

            gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
            gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        };

        this._dispose = () => {
            gl.deleteTexture(u_albedo);
            gl.deleteTexture(u_shading);
            gl.deleteBuffer(quadBuffer);
        };
    }

    protected _getVertexSource(): string {
        return vertexShaderSource;
    }

    protected _getFragmentSource(): string {
        return fragmentShaderSource;
    }
}

export { IntrinsicImageProgram };
