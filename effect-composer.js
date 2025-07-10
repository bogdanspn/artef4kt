/**
 * Simplified EffectComposer for ARTEF4KT
 * Provides basic post-processing capabilities without ES module dependencies
 */

// Basic Pass class
class Pass {
    constructor() {
        this.enabled = true;
        this.needsSwap = true;
        this.renderToScreen = false;
    }

    setSize(width, height) {
        // Override in subclasses
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        // Override in subclasses
    }

    dispose() {
        // Override in subclasses
    }
}

// RenderPass implementation
class RenderPass extends Pass {
    constructor(scene, camera, overrideMaterial, clearColor, clearAlpha) {
        super();
        
        this.scene = scene;
        this.camera = camera;
        this.overrideMaterial = overrideMaterial;
        this.clearColor = clearColor;
        this.clearAlpha = clearAlpha;
        
        this.needsSwap = false;
        this.clearDepth = true; // Enable clearing depth by default
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        const oldRenderTarget = renderer.getRenderTarget();
        const oldClearColor = new THREE.Color();
        renderer.getClearColor(oldClearColor);
        const oldClearAlpha = renderer.getClearAlpha();
        const oldAutoClear = renderer.autoClear;

        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);

        if (this.clearColor) {
            renderer.setClearColor(this.clearColor, this.clearAlpha || 0.0);
        }

        // Clear the render target
        if (this.clearDepth || this.clearColor) {
            renderer.clear();
        }

        renderer.autoClear = false;
        
        if (this.overrideMaterial) {
            this.scene.overrideMaterial = this.overrideMaterial;
        }
        
        renderer.render(this.scene, this.camera);
        
        if (this.overrideMaterial) {
            this.scene.overrideMaterial = null;
        }

        renderer.setRenderTarget(oldRenderTarget);
        renderer.setClearColor(oldClearColor);
        renderer.setClearAlpha(oldClearAlpha);
        renderer.autoClear = oldAutoClear;
    }
}

// ShaderPass implementation
class ShaderPass extends Pass {
    constructor(shader, textureID) {
        super();
        
        this.textureID = textureID !== undefined ? textureID : 'tDiffuse';
        
        if (shader instanceof THREE.ShaderMaterial) {
            this.uniforms = shader.uniforms;
            this.material = shader;
        } else if (shader) {
            this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            this.material = new THREE.ShaderMaterial({
                defines: Object.assign({}, shader.defines),
                uniforms: this.uniforms,
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader
            });
        }

        this.fsQuad = new FullScreenQuad(this.material);
    }

    render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
        if (this.uniforms[this.textureID]) {
            this.uniforms[this.textureID].value = readBuffer.texture;
        }

        this.fsQuad.material = this.material;

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            this.fsQuad.render(renderer);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (renderer.autoClear) renderer.clear();
            this.fsQuad.render(renderer);
        }
    }

    dispose() {
        this.material.dispose();
        this.fsQuad.dispose();
    }
}

// FullScreenQuad helper
class FullScreenQuad {
    constructor(material) {
        this._mesh = new THREE.Mesh(FullScreenQuad.geometry, material);
    }

    dispose() {
        this._mesh.geometry.dispose();
    }

    render(renderer) {
        renderer.render(this._mesh, FullScreenQuad.camera);
    }

    get material() {
        return this._mesh.material;
    }

    set material(value) {
        this._mesh.material = value;
    }
}

FullScreenQuad.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
FullScreenQuad.geometry = new THREE.PlaneGeometry(2, 2);

// Main EffectComposer class
class EffectComposer {
    constructor(renderer, renderTarget) {
        this.renderer = renderer;
        this._pixelRatio = renderer.getPixelRatio();

        if (renderTarget === undefined) {
            const size = renderer.getSize(new THREE.Vector2());
            this._width = size.width;
            this._height = size.height;

            renderTarget = new THREE.WebGLRenderTarget(
                this._width * this._pixelRatio, 
                this._height * this._pixelRatio,
                {
                    type: THREE.HalfFloatType || THREE.FloatType || THREE.UnsignedByteType
                }
            );
            renderTarget.texture.name = 'EffectComposer.rt1';
        } else {
            this._width = renderTarget.width;
            this._height = renderTarget.height;
        }

        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();
        this.renderTarget2.texture.name = 'EffectComposer.rt2';

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;

        this.renderToScreen = true;
        this.passes = [];

        // Copy shader for internal operations
        this.copyPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float opacity;
                uniform sampler2D tDiffuse;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = texture2D(tDiffuse, vUv);
                    gl_FragColor.a *= opacity;
                }
            `
        });
        
        this.copyPass.material.blending = THREE.NoBlending;
        this.clock = new THREE.Clock();
    }

    swapBuffers() {
        const tmp = this.readBuffer;
        this.readBuffer = this.writeBuffer;
        this.writeBuffer = tmp;
    }

    addPass(pass) {
        this.passes.push(pass);
        pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }

    insertPass(pass, index) {
        this.passes.splice(index, 0, pass);
        pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }

    removePass(pass) {
        const index = this.passes.indexOf(pass);
        if (index !== -1) {
            this.passes.splice(index, 1);
        }
    }

    isLastEnabledPass(passIndex) {
        for (let i = passIndex + 1; i < this.passes.length; i++) {
            if (this.passes[i].enabled) {
                return false;
            }
        }
        return true;
    }

    render(deltaTime) {
        if (deltaTime === undefined) {
            deltaTime = this.clock.getDelta();
        }

        const currentRenderTarget = this.renderer.getRenderTarget();

        for (let i = 0, il = this.passes.length; i < il; i++) {
            const pass = this.passes[i];

            if (pass.enabled === false) continue;

            pass.renderToScreen = (this.renderToScreen && this.isLastEnabledPass(i));
            pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, false);

            if (pass.needsSwap) {
                this.swapBuffers();
            }
        }

        this.renderer.setRenderTarget(currentRenderTarget);
    }

    reset(renderTarget) {
        if (renderTarget === undefined) {
            const size = this.renderer.getSize(new THREE.Vector2());
            this._pixelRatio = this.renderer.getPixelRatio();
            this._width = size.width;
            this._height = size.height;

            renderTarget = this.renderTarget1.clone();
            renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
        }

        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.renderTarget1 = renderTarget;
        this.renderTarget2 = renderTarget.clone();

        this.writeBuffer = this.renderTarget1;
        this.readBuffer = this.renderTarget2;
    }

    setSize(width, height) {
        this._width = width;
        this._height = height;

        const effectiveWidth = this._width * this._pixelRatio;
        const effectiveHeight = this._height * this._pixelRatio;

        this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
        this.renderTarget2.setSize(effectiveWidth, effectiveHeight);

        for (let i = 0; i < this.passes.length; i++) {
            this.passes[i].setSize(effectiveWidth, effectiveHeight);
        }
    }

    setPixelRatio(pixelRatio) {
        this._pixelRatio = pixelRatio;
        this.setSize(this._width, this._height);
    }

    dispose() {
        this.renderTarget1.dispose();
        this.renderTarget2.dispose();
        this.copyPass.dispose();
    }
}

// Add to THREE namespace for compatibility
if (typeof THREE !== 'undefined') {
    THREE.EffectComposer = EffectComposer;
    THREE.RenderPass = RenderPass;
    THREE.ShaderPass = ShaderPass;
    THREE.Pass = Pass;
    console.log('✅ EffectComposer loaded successfully!');
    console.log('Available THREE constants:', {
        HalfFloatType: THREE.HalfFloatType,
        FloatType: THREE.FloatType,
        UnsignedByteType: THREE.UnsignedByteType,
        NoBlending: THREE.NoBlending
    });
} else {
    console.error('❌ THREE.js not available when loading EffectComposer');
}
