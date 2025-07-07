/**
 * Custom Blob Shader System for ARTEF4KT Ferrofluid Visualizer
 * Replaces standard Three.js materials with high-performance custom shaders
 * Handles main ferrofluid blob, floating blobs, and orbital blobs with GPU acceleration
 */

class BlobShaderSystem {
    constructor(ferrofluidVisualizer) {
        this.visualizer = ferrofluidVisualizer;
        this.scene = ferrofluidVisualizer.scene;
        this.renderer = ferrofluidVisualizer.renderer;
          // Shader configuration
        this.config = {
            audioTexSize: 256,
            deformationStrength: 0.5,
            audioResponsiveness: 1.2,
            metalness: 0.9,
            roughness: 0.1,
            subsurfaceScattering: true,
            normalMapStrength: 1.0
        };
        
        // System state
        this.isInitialized = false;
        this.materialsReplaced = false;
        this.initializationTime = Date.now();
        this.audioTexture = null;
        this.shaderMaterials = {};
        this.originalMaterials = {}; // Store original materials for fallback
        
        // Performance monitoring
        this.performanceMonitor = {
            frameTime: 0,
            averageFrameTime: 16.67, // 60fps baseline
            qualityLevel: 'medium',
            autoAdjust: true
        };
        
        // Performance optimization flag
        this.skipShaderUpdate = false;
          this.initialize();
    }    /**
     * Initialize the blob shader system
     */
    initialize() {
        console.log('Initializing Custom Blob Shader System...');
        
        try {
            // Create audio texture for GPU audio data
            this.createAudioTexture();
            
            // Create custom shader materials
            this.createBlobShaderMaterials();
            
            // Mark as initialized but DON'T replace materials yet
            // Let the main scene initialize first
            this.isInitialized = true;
            this.materialsReplaced = false;
            
            console.log('Custom Blob Shader System initialized successfully');
            console.log('Shader system status:');
            console.log('  - Audio texture:', this.audioTexture);
            console.log('  - Shader materials:', Object.keys(this.shaderMaterials));
            console.log('  - Scene objects:', this.scene.children.length);
            console.log('Material replacement will happen after scene objects are created');
        } catch (error) {
            console.error('Failed to initialize Blob Shader System:', error);
            console.error('Stack trace:', error.stack);
            this.isInitialized = false;
            // Don't fall back to standard materials - let the original system handle rendering
            console.log('Blob Shader System disabled - using original materials');
        }
    }


    
    /**
     * Create audio texture for passing audio data to shaders
     */
    createAudioTexture() {
        const size = this.config.audioTexSize;
        const data = new Float32Array(size * 4); // RGBA channels
        
        this.audioTexture = new THREE.DataTexture(
            data, 
            size, 
            1, 
            THREE.RGBAFormat, 
            THREE.FloatType
        );
        this.audioTexture.needsUpdate = true;
        
        console.log(`Audio texture created: ${size}x1 RGBA Float`);
    }
      /**
     * Create custom shader materials for all blob types
     */
    createBlobShaderMaterials() {
        try {
            console.log('Creating main ferrofluid shader material...');
            
            // Main ferrofluid blob shader material
            this.shaderMaterials.mainFerrofluid = new THREE.ShaderMaterial({
                vertexShader: `
                    uniform float bassIntensity;
                    uniform float midIntensity;
                    uniform float highIntensity;
                    uniform float time;

                    varying vec3 vNormal;
                    varying vec3 vWorldPosition;

                    void main() {
                        vec3 pos = position;

                        // Layered deformation based on audio frequencies
                        float bassDeform = sin(time + pos.x * bassIntensity) * 0.2;
                        float midDeform = cos(time + pos.y * midIntensity) * 0.15;
                        float highDeform = sin(time + pos.z * highIntensity) * 0.1;

                        pos += normal * (bassDeform + midDeform + highDeform);

                        vNormal = normalize(normalMatrix * normal);
                        vWorldPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    varying vec3 vNormal;
                    varying vec3 vWorldPosition;

                    uniform float time;

                    void main() {
                        vec3 baseColor = vec3(0.1, 0.1, 0.1);

                        // Procedural texture generation
                        float noise(vec3 p) {
                            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                        }

                        // Generate seamless noise pattern
                        float pattern = noise(vWorldPosition * 0.5 + time * 0.1);
                        vec3 finalColor = mix(baseColor, vec3(0.0), pattern);

                        gl_FragColor = vec4(finalColor, 1.0);
                    }
                `,
                uniforms: {
                    time: { value: 0.0 },
                    bassIntensity: { value: 0.0 },
                    midIntensity: { value: 0.0 },
                    highIntensity: { value: 0.0 },
                },
                transparent: false,
                side: THREE.FrontSide,
                depthWrite: true,
                depthTest: true
            });
            
            // Test shader compilation by setting a test uniform
            this.shaderMaterials.mainFerrofluid.uniforms.time.value = 0.1;
            
            console.log('Main ferrofluid shader material created successfully');
        } catch (error) {
            console.error('Failed to create main ferrofluid shader:', error);
            throw error;
        }
        
        try {
            console.log('Creating floating blob shader material...');
            
            // Floating blob shader material
            this.shaderMaterials.floatingBlob = new THREE.ShaderMaterial({
                vertexShader: this.getFloatingBlobVertexShader(),
                fragmentShader: this.getFloatingBlobFragmentShader(),
                uniforms: this.createFloatingBlobUniforms(),
                transparent: false,  // Changed from true to false to fix transparency issues
                side: THREE.FrontSide,
                depthWrite: true,
                depthTest: true
            });
            
            console.log('Floating blob shader material created successfully');
        } catch (error) {
            console.error('Failed to create floating blob shader:', error);
            throw error;
        }
        
        try {
            console.log('Creating inner core shader material...');
            
            // Inner core shader material for floating blobs
            this.shaderMaterials.innerCore = new THREE.ShaderMaterial({
                vertexShader: this.getInnerCoreVertexShader(),
                fragmentShader: this.getInnerCoreFragmentShader(),
                uniforms: this.createInnerCoreUniforms(),
                transparent: false,
                side: THREE.BackSide,
                depthWrite: true,
                depthTest: true
            });
            
            console.log('Inner core shader material created successfully');
        } catch (error) {
            console.error('Failed to create inner core shader:', error);
            throw error;
        }
        
        console.log('All custom blob shader materials created successfully');
    }
    
    /**
     * Replace existing blob materials with custom shaders
     */
    replaceBlobMaterials() {
        if (!this.isInitialized) {
            console.log('Blob Shader System not initialized - skipping material replacement');
            return;
        }
        
        console.log('Starting material replacement...');
        console.log('Available objects:');
        console.log('  - ferrofluid:', !!this.visualizer.ferrofluid);
        console.log('  - floatingBlobs:', this.visualizer.floatingBlobs?.length || 0);
        console.log('  - orbitalBlobSystem:', !!this.visualizer.orbitalBlobSystem);
        
        // Replace main ferrofluid blob material (may not exist yet during initialization)
        if (this.visualizer.ferrofluid && this.visualizer.ferrofluid.material) {
            try {
                console.log('🔄 Replacing main ferrofluid material...');
                this.originalMaterials.mainFerrofluid = this.visualizer.ferrofluid.material;
                this.visualizer.ferrofluid.material = this.shaderMaterials.mainFerrofluid;
                console.log('Main ferrofluid blob material replaced with custom shader');
            } catch (error) {
                console.warn('Failed to replace main ferrofluid material:', error);
                // Keep original material if shader fails
            }
        } else {
            console.log('Main ferrofluid not ready yet - will replace material when available');
        }
        
        // Replace floating blob materials
        if (this.visualizer.floatingBlobs && this.visualizer.floatingBlobs.length > 0) {
            this.originalMaterials.floatingBlobs = [];
            this.originalMaterials.innerCores = [];
            
            console.log(`Replacing ${this.visualizer.floatingBlobs.length} floating blob materials...`);
            
            this.visualizer.floatingBlobs.forEach((blobData, index) => {
                if (blobData.mesh && blobData.mesh.material) {
                    this.originalMaterials.floatingBlobs[index] = blobData.mesh.material;
                    blobData.mesh.material = this.shaderMaterials.floatingBlob.clone();
                    
                    // Also replace inner core material
                    if (blobData.innerCore && blobData.innerCore.material) {
                        this.originalMaterials.innerCores[index] = blobData.innerCore.material;
                        blobData.innerCore.material = this.shaderMaterials.innerCore.clone();
                    }
                }
            });
            
            console.log(` ${this.visualizer.floatingBlobs.length} floating blob materials replaced with custom shaders`);
        }
        
        // Replace orbital blob materials (if using orbital blob system)
        if (this.visualizer.orbitalBlobSystem && this.visualizer.orbitalBlobSystem.orbitalBlobs) {
            this.originalMaterials.orbitalBlobs = [];
            
            console.log(`🔄 Replacing ${this.visualizer.orbitalBlobSystem.orbitalBlobs.length} orbital blob materials...`);
            
            this.visualizer.orbitalBlobSystem.orbitalBlobs.forEach((blob, index) => {
                if (blob.mesh && blob.mesh.material) {
                    this.originalMaterials.orbitalBlobs[index] = blob.mesh.material;
                    blob.mesh.material = this.shaderMaterials.floatingBlob.clone(); // Reuse floating blob shader
                }
            });
            
            console.log(` ${this.visualizer.orbitalBlobSystem.orbitalBlobs.length} orbital blob materials replaced`);
        }
        
        console.log('Material replacement complete');
    }
    
    /**
     * Fallback to standard materials if shader initialization fails
     */
    fallbackToStandardMaterials() {
        console.log('Falling back to standard Three.js materials');
        
        // Restore original materials
        if (this.originalMaterials.mainFerrofluid && this.visualizer.ferrofluid) {
            this.visualizer.ferrofluid.material = this.originalMaterials.mainFerrofluid;
        }
        
        if (this.originalMaterials.floatingBlobs && this.visualizer.floatingBlobs) {
            this.visualizer.floatingBlobs.forEach((blobData, index) => {
                if (this.originalMaterials.floatingBlobs[index] && blobData.mesh) {
                    blobData.mesh.material = this.originalMaterials.floatingBlobs[index];
                }
                if (this.originalMaterials.innerCores[index] && blobData.innerCore) {
                    blobData.innerCore.material = this.originalMaterials.innerCores[index];
                }
            });
        }
    }
    
    // Note: Particle geometries are handled by existing blob systems
    // The BlobShaderSystem only manages shader materials
    
    // Note: Geometry creation is handled by existing blob systems
      /**
     * Create uniforms for main ferrofluid blob shader
     */
    createMainFerrofluidUniforms() {
        return {
            // Time and animation
            time: { value: 0.0 },
            deltaTime: { value: 0.016 },
            
            // Audio reactivity
            bassIntensity: { value: 0.0 },
            midIntensity: { value: 0.0 },
            highIntensity: { value: 0.0 },
            
            // Material properties
            metalness: { value: this.config.metalness },
            roughness: { value: this.config.roughness },
            deformationStrength: { value: this.config.deformationStrength },
            audioResponsiveness: { value: this.config.audioResponsiveness },
            normalMapStrength: { value: this.config.normalMapStrength },
            
            // Colors
            baseColor: { value: new THREE.Color(0x2a2a2a) },  // Lighter base color for better metallic look
            highlightColor: { value: new THREE.Color(0x999999) },  // Brighter highlight
            
            // Deformation centers (blob center system)
            blobCenters: { value: [] },
            numBlobCenters: { value: 0 }
        };
    }

    /**
     * Create uniforms for floating blob shader
     */
    createFloatingBlobUniforms() {
        return {
            // Time and animation
            time: { value: 0.0 },
            deltaTime: { value: 0.016 },
            
            // Audio reactivity
            bassIntensity: { value: 0.0 },
            midIntensity: { value: 0.0 },
            highIntensity: { value: 0.0 },
            
            // Material properties
            metalness: { value: this.config.metalness },
            roughness: { value: this.config.roughness },
            deformationStrength: { value: this.config.deformationStrength * 0.7 },
            audioResponsiveness: { value: this.config.audioResponsiveness * 0.8 },
            
            // Colors
            baseColor: { value: new THREE.Color(0x333333) },
            highlightColor: { value: new THREE.Color(0x888888) },
            
            // Floating blob specific properties
            blobScale: { value: 1.0 },
            life: { value: 1.0 },
            morphIntensity: { value: 0.2 }
        };
    }
      /**
     * Create uniforms for inner core shader
     */
    createInnerCoreUniforms() {
        return {
            // Time and animation
            time: { value: 0.0 },
            
            // Simple black core material
            coreColor: { value: new THREE.Color(0x000000) },
            opacity: { value: 1.0 }
        };
    }

    /**
     * Get main ferrofluid blob vertex shader
     */
    getMainFerrofluidVertexShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float bassIntensity;
            uniform float midIntensity;
            uniform float highIntensity;
            uniform float deformationStrength;
            uniform float audioResponsiveness;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 pos = position;
                
                // Simple time-based deformation for testing
                float simpleWave = sin(time + pos.x) * 0.1;
                pos += normal * simpleWave * deformationStrength;
                
                // Calculate matrices
                vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                gl_Position = projectionMatrix * mvPosition;
                
                // Pass to fragment shader
                vWorldPosition = worldPosition.xyz;
                vNormal = normalMatrix * normal;
                vUv = uv;
                vViewPosition = -mvPosition.xyz;
            }
        `;
    }

    /**
     * Get main ferrofluid blob fragment shader
     */
    getMainFerrofluidFragmentShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float metalness;
            uniform float roughness;
            uniform vec3 baseColor;
            uniform vec3 highlightColor;
            uniform float bassIntensity;
            uniform float midIntensity;
            uniform float highIntensity;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                
                // Simple lighting calculation
                vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
                float NdotL = max(dot(normal, lightDir), 0.0);
                
                // Basic metallic surface
                float fresnel = pow(1.0 - dot(normal, viewDir), 2.0);
                vec3 surfaceColor = mix(baseColor, highlightColor, fresnel * metalness);
                
                // Simple lighting
                vec3 finalColor = surfaceColor * (0.3 + 0.7 * NdotL);
                
                // Audio-reactive brightness
                float audioInfluence = bassIntensity + midIntensity + highIntensity;
                finalColor *= (0.8 + 0.2 * audioInfluence);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }
    
    /**
     * Get floating blob vertex shader
     */
    getFloatingBlobVertexShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float bassIntensity;
            uniform float midIntensity;
            uniform float highIntensity;
            uniform float deformationStrength;
            uniform float audioResponsiveness;
            uniform float blobScale;
            uniform float morphIntensity;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            
            // Simplex noise for organic deformation
            vec3 mod289(vec3 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 mod289(vec4 x) {
                return x - floor(x * (1.0 / 289.0)) * 289.0;
            }
            
            vec4 permute(vec4 x) {
                return mod289(((x*34.0)+1.0)*x);
            }
            
            vec4 taylorInvSqrt(vec4 r) {
                return 1.79284291400159 - 0.85373472095314 * r;
            }
            
            float snoise(vec3 v) {
                const vec2 C = vec2(1.0/6.0, 1.0/3.0);
                const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
                
                vec3 i = floor(v + dot(v, C.yyy));
                vec3 x0 = v - i + dot(i, C.xxx);
                
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min(g.xyz, l.zxy);
                vec3 i2 = max(g.xyz, l.zxy);
                
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                
                i = mod289(i);
                vec4 p = permute(permute(permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
                
                float n_ = 0.142857142857;
                vec3 ns = n_ * D.wyz - D.xzx;
                
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_);
                
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                
                vec4 b0 = vec4(x.xy, y.xy);
                vec4 b1 = vec4(x.zw, y.zw);
                
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
                
                vec3 p0 = vec3(a0.xy, h.x);
                vec3 p1 = vec3(a0.zw, h.y);
                vec3 p2 = vec3(a1.xy, h.z);
                vec3 p3 = vec3(a1.zw, h.w);
                
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x;
                p1 *= norm.y;
                p2 *= norm.z;
                p3 *= norm.w;
                
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
            }
            
            void main() {
                vec3 pos = position * blobScale;
                
                // Floating blob specific deformation - smaller, more agile
                vec3 noisePos = pos * 1.5 + time * 0.8;
                float baseNoise = snoise(noisePos) * 0.08;
                
                // Audio deformation scaled for floating blobs
                float audioInfluence = (bassIntensity + midIntensity + highIntensity) * audioResponsiveness * 0.7;
                
                // Quick, jittery movements for smaller blobs
                vec3 jitterPos = pos * 4.0 + time * 2.0;
                float jitter = snoise(jitterPos) * highIntensity * 0.3;
                
                // Smooth undulations
                vec3 wavePos = pos * 0.8 + time * 0.6;
                float wave = snoise(wavePos) * (bassIntensity + midIntensity) * 0.2;
                
                // Combine deformations with floating blob intensity
                float totalDeformation = (baseNoise + jitter + wave) * deformationStrength * morphIntensity;
                
                // Apply deformation
                vec3 norm = normalize(pos);
                pos += norm * totalDeformation;
                
                // Calculate matrices
                vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                
                gl_Position = projectionMatrix * mvPosition;
                
                // Pass to fragment shader
                vWorldPosition = worldPosition.xyz;
                vNormal = normalMatrix * normal;
                vUv = uv;
                vViewPosition = -mvPosition.xyz;
            }
        `;
    }

    /**
     * Get floating blob fragment shader
     */
    getFloatingBlobFragmentShader() {
        return `
            precision highp float;
            
            uniform float time;
            uniform float metalness;
            uniform float roughness;
            uniform vec3 baseColor;
            uniform vec3 highlightColor;
            uniform float bassIntensity;
            uniform float midIntensity;
            uniform float highIntensity;
            uniform float life;
            
            varying vec3 vWorldPosition;
            varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                
                // Fresnel for metallic floating blobs
                float fresnel = pow(1.0 - dot(normal, viewDir), 1.8);
                
                // Audio-reactive coloring
                float audioInfluence = bassIntensity + midIntensity + highIntensity;
                vec3 audioColor = vec3(
                    0.3 + bassIntensity * 0.7,
                    0.3 + midIntensity * 0.8,
                    0.3 + highIntensity * 0.6
                );
                
                // Life-based fade
                vec3 surfaceColor = mix(baseColor, audioColor, audioInfluence * 0.4 * life);
                vec3 metalColor = mix(surfaceColor, highlightColor, fresnel * metalness);
                
                // Simple lighting
                vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
                float NdotL = max(dot(normal, lightDir), 0.0);
                
                // Specular
                vec3 halfVector = normalize(lightDir + viewDir);
                float NdotH = max(dot(normal, halfVector), 0.0);
                float specular = pow(NdotH, 24.0) * (1.0 - roughness);
                
                // Floating blob lighting
                vec3 finalColor = metalColor * (0.4 + 0.6 * NdotL) + specular * 0.4;
                
                // Subtle energy pulse
                float pulse = sin(time * 6.0 + vWorldPosition.y) * audioInfluence * 0.05 + 1.0;
                finalColor *= pulse;
                
                // Full opacity for floating blobs
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
    }

    /**
     * Get inner core vertex shader (simple pass-through)
     */
    getInnerCoreVertexShader() {
        return `
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Get inner core fragment shader (simple black)
     */
    getInnerCoreFragmentShader() {
        return `
            uniform vec3 coreColor;
            uniform float opacity;
            
            void main() {
                gl_FragColor = vec4(coreColor, opacity);
            }
        `;
    }
    
    // Note: Particle systems are handled by existing blob systems
    // The BlobShaderSystem only manages shader materials

    /**
     * Update the blob shader system - main update method
     */
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Try to replace materials if not done yet
        if (!this.materialsReplaced) {
            this.attemptMaterialReplacement();
        }
        
        // Performance optimization: Skip shader updates during intense music to prevent freezing
        const totalMusicInfluence = (this.visualizer.bassIntensity || 0) + 
                                   (this.visualizer.midIntensity || 0) + 
                                   (this.visualizer.highIntensity || 0);
        
        if (totalMusicInfluence > 0.9) {
            this.skipShaderUpdate = !this.skipShaderUpdate;
            if (this.skipShaderUpdate) return;
        }
        
        const time = performance.now() * 0.001;
        
        try {
            // Update audio texture with current audio data
            this.updateAudioTexture();
            
            // Update all shader uniforms
            this.updateShaderUniforms(time, deltaTime);
            
            // Update performance monitoring
            this.updatePerformanceMonitoring(deltaTime);
            
            // Check for new floating blobs that need material replacement
            this.checkForNewBlobs();
            
        } catch (error) {
            console.warn('Error updating BlobShaderSystem:', error);
        }
    }

    /**
     * Attempt to replace materials when scene objects are ready
     */
    attemptMaterialReplacement() {
        try {
            // Safety timeout: If we haven't replaced materials after 10 seconds, give up
            if (Date.now() - this.initializationTime > 10000) {
                console.warn('⚠️ Shader system timeout - disabling to prevent black canvas');
                this.isInitialized = false;
                this.materialsReplaced = true; // Stop trying
                return;
            }
            
            // Check if we have at least one object ready for material replacement
            const hasMainFerrofluid = this.visualizer.ferrofluid && this.visualizer.ferrofluid.material;
            const hasFloatingBlobs = this.visualizer.floatingBlobs && this.visualizer.floatingBlobs.length > 0;
            
            if (hasMainFerrofluid || hasFloatingBlobs) {
                console.log('🎯 Scene objects detected, attempting material replacement...');
                this.replaceBlobMaterials();
                this.materialsReplaced = true;
                console.log('✅ Material replacement completed successfully');
            }
        } catch (error) {
            console.warn('⚠️ Material replacement failed, will retry next frame:', error);
            
            // If we've been trying for more than 5 seconds, disable the system
            if (Date.now() - this.initializationTime > 5000) {
                console.warn('⚠️ Multiple material replacement failures - disabling shader system');
                this.isInitialized = false;
                this.materialsReplaced = true; // Stop trying
            }
        }
    }
      /**
     * Update particle system transforms - delegated to existing blob systems
     */
    updateParticleTransforms(deltaTime) {
        // The BlobShaderSystem doesn't manage transforms directly
        // It only handles shader material updates
        // Transform updates are handled by the main visualizer's blob systems
        console.log('🔄 Particle transforms handled by existing blob systems');
    }
    
    // Note: Instance transform updates are handled by the main visualizer's blob systems
    // The BlobShaderSystem only manages shader materials, not transforms

    /**
     * Trigger a shockwave effect at a specific position
     */
    triggerShockwave(center, intensity = 1.0) {
        if (!this.isInitialized) {
            console.log('🚫 Blob Shader System disabled - shockwave ignored');
            return;
        }
        
        // Pass shockwave to existing shockwave system instead of handling it here
        if (this.visualizer.shockwaveSystem) {
            this.visualizer.shockwaveSystem.triggerShockwave(center, intensity);
        }
        
        console.log(`✨ Shockwave delegated to ShockwaveSystem at position: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
    }
    
    /**
     * Set specific quality level with proper geometry recreation
     */
    setQualityLevel(level) {
        if (!this.config.qualityLevels[level]) return;
        
        const oldLevel = this.performanceMonitor.qualityLevel;
        this.performanceMonitor.qualityLevel = level;
        const config = this.config.qualityLevels[level];
        
        // Update particle count if it changed
        if (this.particleCount !== config.particles) {
            this.particleCount = config.particles;
            
            // Recreate ferrofluid particle geometry with new count
            const oldGeometry = this.geometries.ferrofluidParticles;
            this.geometries.ferrofluidParticles = this.createFerrofluidParticleGeometry();
            
            // Update the points system
            if (this.particleSystems.ferrofluidParticles) {
                this.particleSystems.ferrofluidParticles.geometry = this.geometries.ferrofluidParticles;
                oldGeometry.dispose();
            }
        }
          console.log(`🎚️ Quality level changed from ${oldLevel} to ${level} (${config.particles} particles)`);
    }
      /**
     * Create particle burst effect at specified position
     */
    createParticleBurst(position, intensity = 1.0, particleCount = 100) {
        if (!this.isInitialized) {
            console.log('🚫 GPU Particle System disabled - particle burst ignored');
            return;
        }
        
        // This could be used to create particle effects when floating blobs spawn
        // For now, we'll trigger a shockwave effect
        this.triggerShockwave(position, intensity);
        
        console.log(`✨ Particle burst created at position: ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`);
    }
    
    /**
     * Enable/disable specific particle systems
     */
    setParticleSystemVisibility(systemName, visible) {
        if (this.particleSystems[systemName]) {
            this.particleSystems[systemName].visible = visible;
            console.log(`🎭 ${systemName} visibility set to: ${visible}`);
        }
    }    /**
     * Get current system performance metrics
     */
    getPerformanceMetrics() {
        // Count actual blobs from the visualizer instead of non-existent particle systems
        const floatingCount = this.visualizer.floatingBlobs ? this.visualizer.floatingBlobs.length : 0;
        const orbitalCount = this.visualizer.orbitalBlobSystem ? this.visualizer.orbitalBlobSystem.orbitalBlobs.length : 0;
        const shockwaveCount = this.visualizer.shockwaveSystem ? 1 : 0;
        const totalBlobs = floatingCount + orbitalCount;
        
        return {
            totalBlobs: totalBlobs,
            floatingBlobCount: floatingCount,
            orbitalBlobCount: orbitalCount,
            shockwaveSystemActive: shockwaveCount > 0,
            performanceLevel: this.performanceMonitor.qualityLevel,
            qualityLevel: this.performanceMonitor.qualityLevel,
            frameTime: this.performanceMonitor.frameTime,
            averageFrameTime: this.performanceMonitor.averageFrameTime,
            isInitialized: this.isInitialized
        };
    }
      /**
     * Update audio texture with current frequency data
     */
    updateAudioTexture() {
        if (!this.visualizer.analyser || !this.audioTexture) return;
        
        const frequencyData = this.visualizer.frequencyData;
        if (!frequencyData) return;
        
        const textureData = this.audioTexture.image.data;
        
        // Pack frequency data into texture
        for (let i = 0; i < Math.min(frequencyData.length, this.config.audioTexSize); i++) {
            const i4 = i * 4;
            const normalizedFreq = frequencyData[i] / 255.0;
            
            textureData[i4] = normalizedFreq;                    // R: Raw frequency
            textureData[i4 + 1] = Math.pow(normalizedFreq, 2);  // G: Squared (bass emphasis)
            textureData[i4 + 2] = Math.sqrt(normalizedFreq);    // B: Square root (high emphasis)
            textureData[i4 + 3] = 1.0;                          // A: Always 1.0
        }
        
        this.audioTexture.needsUpdate = true;
    }

    /**
     * Update shader uniforms for all materials
     */
    updateShaderUniforms(time, deltaTime) {
        const bassIntensity = this.visualizer.bassIntensity || 0;
        const midIntensity = this.visualizer.midIntensity || 0;
        const highIntensity = this.visualizer.highIntensity || 0;
        
        // Update main ferrofluid uniforms
        if (this.shaderMaterials.mainFerrofluid) {
            const uniforms = this.shaderMaterials.mainFerrofluid.uniforms;
            uniforms.time.value = time;
            uniforms.deltaTime.value = deltaTime;
            uniforms.bassIntensity.value = bassIntensity;
            uniforms.midIntensity.value = midIntensity;
            uniforms.highIntensity.value = highIntensity;
        }
        
        // Update floating blob materials
        if (this.visualizer.floatingBlobs) {
            this.visualizer.floatingBlobs.forEach(blobData => {
                if (blobData.mesh && blobData.mesh.material && blobData.mesh.material.uniforms) {
                    const uniforms = blobData.mesh.material.uniforms;
                    if (uniforms.time) uniforms.time.value = time;
                    if (uniforms.deltaTime) uniforms.deltaTime.value = deltaTime;
                    if (uniforms.bassIntensity) uniforms.bassIntensity.value = bassIntensity;
                    if (uniforms.midIntensity) uniforms.midIntensity.value = midIntensity;
                    if (uniforms.highIntensity) uniforms.highIntensity.value = highIntensity;
                    if (uniforms.life) uniforms.life.value = blobData.life || 1.0;
                    if (uniforms.blobScale) uniforms.blobScale.value = blobData.currentScale || 1.0;
                    if (uniforms.morphIntensity) uniforms.morphIntensity.value = blobData.morphIntensity || 0.2;
                }
            });
        }
        
        // Update orbital blob materials
        if (this.visualizer.orbitalBlobSystem && this.visualizer.orbitalBlobSystem.orbitalBlobs) {
            this.visualizer.orbitalBlobSystem.orbitalBlobs.forEach(blobData => {
                if (blobData.mesh && blobData.mesh.material && blobData.mesh.material.uniforms) {
                    const uniforms = blobData.mesh.material.uniforms;
                    if (uniforms.time) uniforms.time.value = time;
                    if (uniforms.deltaTime) uniforms.deltaTime.value = deltaTime;
                    if (uniforms.bassIntensity) uniforms.bassIntensity.value = bassIntensity;
                    if (uniforms.midIntensity) uniforms.midIntensity.value = midIntensity;
                    if (uniforms.highIntensity) uniforms.highIntensity.value = highIntensity;
                    if (uniforms.life) uniforms.life.value = blobData.life || 1.0;
                    if (uniforms.blobScale) uniforms.blobScale.value = blobData.currentScale || 1.0;
                    if (uniforms.morphIntensity) uniforms.morphIntensity.value = blobData.morphIntensity || 0.15;
                }
            });
        }
    }

    /**
     * Check for newly created blobs and replace their materials
     */
    checkForNewBlobs() {
        if (!this.isInitialized) return;
        
        // Check if main ferrofluid is now available and needs material replacement
        if (this.visualizer.ferrofluid && this.visualizer.ferrofluid.material && 
            !this.originalMaterials.mainFerrofluid) {
            this.originalMaterials.mainFerrofluid = this.visualizer.ferrofluid.material;
            this.visualizer.ferrofluid.material = this.shaderMaterials.mainFerrofluid;
            console.log('🔄 Main ferrofluid material replaced with custom shader (delayed)');
        }
        
        // Check floating blobs
        if (this.visualizer.floatingBlobs) {
            this.visualizer.floatingBlobs.forEach(blobData => {
                if (blobData.mesh && blobData.mesh.material && 
                    !blobData.mesh.material.uniforms && 
                    blobData.mesh.material.type !== 'ShaderMaterial') {
                    this.replaceBlobMaterial(blobData, false);
                }
            });
        }
        
        // Check orbital blobs
        if (this.visualizer.orbitalBlobSystem && this.visualizer.orbitalBlobSystem.orbitalBlobs) {
            this.visualizer.orbitalBlobSystem.orbitalBlobs.forEach(blobData => {
                if (blobData.mesh && blobData.mesh.material && 
                    !blobData.mesh.material.uniforms && 
                    blobData.mesh.material.type !== 'ShaderMaterial') {
                    this.replaceBlobMaterial(blobData, true);
                }
            });
        }
    }

    /**
     * Update performance monitoring and auto-adjustment
     */
    updatePerformanceMonitoring(deltaTime) {
        this.performanceMonitor.frameTime = deltaTime * 1000; // Convert to milliseconds
        
        // Simple exponential moving average
        const alpha = 0.1;
        this.performanceMonitor.averageFrameTime = 
            alpha * this.performanceMonitor.frameTime + 
            (1 - alpha) * this.performanceMonitor.averageFrameTime;
        
        // Auto-adjust quality if enabled
        if (this.performanceMonitor.autoAdjust) {
            const currentFPS = 1000 / this.performanceMonitor.averageFrameTime;
            
            if (currentFPS < 30 && this.performanceMonitor.qualityLevel === 'high') {
                this.performanceMonitor.qualityLevel = 'medium';
                console.log('🔧 Auto-adjusting shader quality to medium');
            } else if (currentFPS < 20 && this.performanceMonitor.qualityLevel === 'medium') {
                this.performanceMonitor.qualityLevel = 'low';
                console.log('🔧 Auto-adjusting shader quality to low');
            } else if (currentFPS > 50 && this.performanceMonitor.qualityLevel === 'low') {
                this.performanceMonitor.qualityLevel = 'medium';
                console.log('🔧 Auto-adjusting shader quality to medium');
            } else if (currentFPS > 55 && this.performanceMonitor.qualityLevel === 'medium') {
                this.performanceMonitor.qualityLevel = 'high';
                console.log('🔧 Auto-adjusting shader quality to high');
            }
        }
    }
    
    /**
     * Replace material for a single newly created blob
     */
    replaceBlobMaterial(blobData, isOrbital = false) {
        if (!this.isInitialized) return;
        
        try {
            if (blobData.mesh && blobData.mesh.material) {
                // Store original material for fallback
                const arrayKey = isOrbital ? 'orbitalBlobs' : 'floatingBlobs';
                const coreKey = isOrbital ? 'orbitalCores' : 'innerCores';
                
                if (!this.originalMaterials[arrayKey]) {
                    this.originalMaterials[arrayKey] = [];
                }
                if (!this.originalMaterials[coreKey]) {
                    this.originalMaterials[coreKey] = [];
                }
                
                const index = this.originalMaterials[arrayKey].length;
                this.originalMaterials[arrayKey][index] = blobData.mesh.material;
                
                // Replace with custom shader material
                blobData.mesh.material = this.shaderMaterials.floatingBlob.clone();
                
                // Also replace inner core material if it exists
                if (blobData.innerCore && blobData.innerCore.material) {
                    this.originalMaterials[coreKey][index] = blobData.innerCore.material;
                    blobData.innerCore.material = this.shaderMaterials.innerCore.clone();
                }
                
                console.log(`🔄 ${isOrbital ? 'Orbital' : 'Floating'} blob material replaced with custom shader`);
            }
        } catch (error) {
            console.warn('Failed to replace blob material:', error);
        }
    }
}

// Export for use in main script
window.BlobShaderSystem = BlobShaderSystem;
