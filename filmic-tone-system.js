/**
 * Filmic Tone System for ARTEF4KT
 * Advanced post-processing effects for cinematic visuals
 * Integrates with Three.js and WebGL for real-time filmic effects
 */

class FilmicToneSystem {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        
        // Check if EffectComposer is available
        this.composerAvailable = typeof THREE.EffectComposer !== 'undefined';
        
        // Initialize composer and passes
        this.composer = null;
        this.renderPass = null;
        this.filmicPass = null;
        this.bloomPass = null;
        
        // For fallback mode - store original renderer properties
        this.originalToneMapping = renderer.toneMapping;
        this.originalToneMappingExposure = renderer.toneMappingExposure;
        
        // Track render state changes to avoid debug spam
        this.lastRenderState = null;
        
        // Settings (disabled by default)
        this.settings = {
            enabled: false, // Disabled by default
            
            // Tone Mapping
            toneMapping: 'linear', // 'linear', 'aces', 'reinhard', 'uncharted2'
            exposure: 1.0,
            
            // Color Grading
            contrast: 1.0,
            saturation: 1.0,
            vibrance: 0.0,
            gamma: 1.0,
            
            // Lift/Gamma/Gain (professional color correction)
            lift: { r: 0.0, g: 0.0, b: 0.0 },
            gammaRGB: { r: 1.0, g: 1.0, b: 1.0 },
            gain: { r: 1.0, g: 1.0, b: 1.0 },
            
            // Film Effects
            filmGrainIntensity: 0.0,
            vignetteStrength: 0.0,
            chromaticAberration: 0.0,
            lensDistortion: 0.0,
            
            // Advanced Cinematic Effects
            filmHalation: 0.0,        // Film glow/bleeding effect
            filmScratches: 0.0,       // Procedural film damage
            colorFringing: 0.0,       // Enhanced chromatic aberration
            scanlines: 0.0,           // CRT/TV scanline effect
            
            // Color Temperature & Tint
            colorTemperature: 6500, // Kelvin (neutral)
            tint: 0.0, // Magenta/Green shift
            
            // Bloom Effect
            bloom: {
                enabled: false,
                strength: 0.3,
                radius: 0.4,
                threshold: 0.85
            }
        };
        
        // Initialize efficient grain texture
        this.grainTexture = null;
        this.grainTextureSize = 512; // Small texture for efficiency
        
        this.initializeComposer();
    }
    
    initializeComposer() {
        if (!this.composerAvailable) {
            console.warn('EffectComposer not available. Using fallback mode.');
            console.warn('To enable advanced filmic effects, include Three.js EffectComposer addons:');
            console.warn('- examples/jsm/postprocessing/EffectComposer.js');
            console.warn('- examples/jsm/postprocessing/RenderPass.js'); 
            console.warn('- examples/jsm/postprocessing/ShaderPass.js');
            return;
        }
        
        try {
            // Create composer
            this.composer = new THREE.EffectComposer(this.renderer);
            
            // Add render pass
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);
            
            // Create grain texture
            this.createGrainTexture();
            
            // Add custom filmic pass
            this.filmicPass = new THREE.ShaderPass(this.createFilmicShader());
            this.filmicPass.renderToScreen = true;
            
            // Initialize resolution uniform and grain texture
            const size = this.renderer.getSize(new THREE.Vector2());
            this.filmicPass.uniforms.uResolution.value.set(size.width, size.height);
            this.filmicPass.uniforms.tGrain.value = this.grainTexture;
            
            this.composer.addPass(this.filmicPass);
        } catch (error) {
            console.warn('Failed to initialize EffectComposer:', error);
            this.composerAvailable = false;
            this.composer = null;
            this.filmicPass = null;
        }
    }
    
    createFilmicShader() {
        return {
            uniforms: {
                tDiffuse: { value: null },
                tGrain: { value: null }, // Grain texture
                uEnabled: { value: false },
                uToneMapping: { value: 0 }, // 0: linear, 1: aces, 2: reinhard, 3: uncharted2
                uExposure: { value: 1.0 },
                uContrast: { value: 1.0 },
                uSaturation: { value: 1.0 },
                uVibrance: { value: 0.0 },
                uGamma: { value: 1.0 },
                uLift: { value: new THREE.Vector3(0, 0, 0) },
                uGammaRGB: { value: new THREE.Vector3(1, 1, 1) },
                uGain: { value: new THREE.Vector3(1, 1, 1) },
                uFilmGrainIntensity: { value: 0.0 },
                uVignetteStrength: { value: 0.0 },
                uChromaticAberration: { value: 0.0 },
                uLensDistortion: { value: 0.0 },
                
                // Advanced Cinematic Effects
                uFilmHalation: { value: 0.0 },
                uFilmScratches: { value: 0.0 },
                uColorFringing: { value: 0.0 },
                uScanlines: { value: 0.0 },
                
                uColorTemperature: { value: 6500.0 },
                uTint: { value: 0.0 },
                uTime: { value: 0.0 },
                uResolution: { value: new THREE.Vector2() }
            },
            
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform sampler2D tGrain; // Pre-generated grain texture
                uniform bool uEnabled;
                uniform int uToneMapping;
                uniform float uExposure;
                uniform float uContrast;
                uniform float uSaturation;
                uniform float uVibrance;
                uniform float uGamma;
                uniform vec3 uLift;
                uniform vec3 uGammaRGB;
                uniform vec3 uGain;
                uniform float uFilmGrainIntensity;
                uniform float uVignetteStrength;
                uniform float uChromaticAberration;
                uniform float uLensDistortion;
                
                // Advanced Cinematic Effects
                uniform float uFilmHalation;
                uniform float uFilmScratches;
                uniform float uColorFringing;
                uniform float uScanlines;
                
                uniform float uColorTemperature;
                uniform float uTint;
                uniform float uTime;
                uniform vec2 uResolution;
                
                varying vec2 vUv;
                
                // High-quality simple random function for film grain
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                // Efficient film grain using pre-generated texture
                float filmGrain(vec2 uv, float time) {
                    // Use multiple offset samples from the grain texture for variation
                    vec2 grainUV1 = uv * 128.0 + vec2(time * 0.5, time * 1.2); // Finer grain scale with more movement
                    vec2 grainUV2 = uv * 96.0 + vec2(sin(time * 0.8) * 4.0, cos(time * 1.1) * 6.0);
                    vec2 grainUV3 = uv * 80.0 + vec2(cos(time * 0.6) * 3.0, sin(time * 0.9) * 5.0);
                    
                    // Sample grain texture with slight temporal offsets
                    float grain1 = texture2D(tGrain, grainUV1).r;
                    float grain2 = texture2D(tGrain, grainUV2).r;
                    float grain3 = texture2D(tGrain, grainUV3).r;
                    
                    // Combine samples for richer, more visible grain
                    return mix(mix(grain1, grain2, 0.6), grain3, 0.4);
                }
                
                // ACES Filmic Tone Mapping
                vec3 acesFilmicToneMapping(vec3 color) {
                    mat3 m1 = mat3(
                        0.59719, 0.07600, 0.02840,
                        0.35458, 0.90834, 0.13383,
                        0.04823, 0.01566, 0.83777
                    );
                    mat3 m2 = mat3(
                        1.60475, -0.10208, -0.00327,
                        -0.53108,  1.10813, -0.07276,
                        -0.07367, -0.00605,  1.07602
                    );
                    vec3 v = m1 * color;
                    vec3 a = v * (v + 0.0245786) - 0.000090537;
                    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
                    return clamp(m2 * (a / b), 0.0, 1.0);
                }
                
                // Reinhard Tone Mapping
                vec3 reinhardToneMapping(vec3 color) {
                    return color / (color + vec3(1.0));
                }
                
                // Uncharted 2 Tone Mapping
                vec3 uncharted2ToneMapping(vec3 color) {
                    float A = 0.15;
                    float B = 0.50;
                    float C = 0.10;
                    float D = 0.20;
                    float E = 0.02;
                    float F = 0.30;
                    
                    vec3 x = color;
                    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
                }
                
                // Color temperature conversion
                vec3 colorTemperatureToRGB(float temperature) {
                    temperature = clamp(temperature, 1000.0, 40000.0) / 100.0;
                    
                    float red, green, blue;
                    
                    if (temperature <= 66.0) {
                        red = 255.0;
                        green = temperature;
                        green = 99.4708025861 * log(green) - 161.1195681661;
                        
                        if (temperature >= 19.0) {
                            blue = temperature - 10.0;
                            blue = 138.5177312231 * log(blue) - 305.0447927307;
                        } else {
                            blue = 0.0;
                        }
                    } else {
                        red = temperature - 60.0;
                        red = 329.698727446 * pow(red, -0.1332047592);
                        
                        green = temperature - 60.0;
                        green = 288.1221695283 * pow(green, -0.0755148492);
                        
                        blue = 255.0;
                    }
                    
                    return clamp(vec3(red, green, blue) / 255.0, 0.0, 1.0);
                }
                
                // Lift Gamma Gain color correction
                vec3 liftGammaGain(vec3 color, vec3 lift, vec3 gamma, vec3 gain) {
                    color = color * gain + lift;
                    return pow(max(color, vec3(0.0)), gamma);
                }
                
                // Vibrance adjustment
                vec3 adjustVibrance(vec3 color, float vibrance) {
                    float maxColor = max(color.r, max(color.g, color.b));
                    float minColor = min(color.r, min(color.g, color.b));
                    float sat = maxColor - minColor;
                    return mix(color, color * (1.0 + vibrance), sat);
                }
                
                // Lens distortion
                vec2 lensDistortion(vec2 uv, float strength) {
                    vec2 center = vec2(0.5);
                    vec2 delta = uv - center;
                    float dist = length(delta);
                    float factor = 1.0 + strength * dist * dist;
                    return center + delta * factor;
                }
                
                // Film halation (glow/bleeding effect) - works with processed color
                vec3 filmHalation(vec3 processedColor, sampler2D tex, vec2 uv, float strength) {
                    if (strength <= 0.0) return processedColor;
                    
                    vec3 glow = vec3(0.0);
                    
                    // Sample surrounding pixels for glow from original texture
                    float radius = strength * 0.01;
                    int samples = 8;
                    
                    for (int i = 0; i < 8; i++) {
                        float angle = float(i) * 0.785398; // PI/4
                        vec2 offset = vec2(cos(angle), sin(angle)) * radius;
                        glow += texture2D(tex, uv + offset).rgb;
                    }
                    
                    glow /= float(samples);
                    float luminance = dot(processedColor, vec3(0.299, 0.587, 0.114));
                    return mix(processedColor, processedColor + glow * luminance * strength * 0.5, min(strength, 0.8));
                }
                
                // Film scratches and dust (improved - varied lengths, sparser)
                float filmScratches(vec2 uv, float time, float intensity) {
                    if (intensity <= 0.0) return 1.0;
                    
                    float damage = 1.0;
                    
                    // Long vertical scratches (sparse)
                    float longScratch1 = smoothstep(0.9998, 1.0, sin(uv.x * 200.0 + sin(time * 0.02) * 20.0));
                    float longScratch2 = smoothstep(0.9997, 1.0, sin(uv.x * 150.0 + sin(time * 0.015) * 25.0));
                    
                    // Medium scratches with limited vertical extent
                    float medScratch = smoothstep(0.9995, 1.0, sin(uv.x * 400.0 + sin(time * 0.03) * 15.0)) * 
                                       smoothstep(0.3, 0.7, sin(uv.y * 5.0 + time * 0.01));
                    
                    // Short scratches (very limited extent)
                    float shortScratch1 = smoothstep(0.999, 1.0, sin(uv.x * 800.0 + sin(time * 0.04) * 10.0)) * 
                                          smoothstep(0.1, 0.3, sin(uv.y * 20.0 + time * 0.02));
                    float shortScratch2 = smoothstep(0.9992, 1.0, sin(uv.x * 600.0 + sin(time * 0.025) * 12.0)) * 
                                          smoothstep(0.6, 0.8, sin(uv.y * 15.0 + time * 0.018));
                    
                    // Sparse diagonal scratch (rare)
                    float diagScratch = smoothstep(0.9999, 1.0, sin((uv.x + uv.y * 0.3) * 100.0 + time * 0.01)) *
                                       smoothstep(0.2, 0.6, sin(uv.y * 3.0));
                    
                    // Sparse dust spots (much less frequent)
                    float dust1 = smoothstep(0.985, 1.0, random(uv * 50.0 + sin(time * 0.05) * 5.0));
                    float dust2 = smoothstep(0.99, 1.0, random(uv * 30.0 + cos(time * 0.03) * 8.0));
                    
                    // Very occasional hair artifacts
                    float hair = smoothstep(0.9995, 1.0, sin(uv.y * 1000.0 + time * 0.02)) *
                                 smoothstep(0.1, 0.4, sin(uv.x * 8.0));
                    
                    // Combine damage types with appropriate weights
                    float totalScratches = longScratch1 * 0.8 + longScratch2 * 0.6 + 
                                          medScratch * 0.4 + shortScratch1 * 0.3 + shortScratch2 * 0.2;
                    float totalDust = (dust1 + dust2) * 0.1;
                    float totalSpecial = (diagScratch + hair) * 0.15;
                    
                    damage = 1.0 - (totalScratches + totalDust + totalSpecial) * intensity * 0.7;
                    
                    return clamp(damage, 0.3, 1.0);
                }
                
                // Enhanced color fringing (advanced chromatic aberration)
                vec3 colorFringing(sampler2D tex, vec2 uv, float strength) {
                    if (strength <= 0.0) return texture2D(tex, uv).rgb;
                    
                    vec2 center = uv - 0.5;
                    float dist = length(center);
                    vec2 direction = normalize(center);
                    
                    // Different offsets for each color channel
                    float redOffset = strength * dist * 0.008;
                    float greenOffset = strength * dist * 0.004;
                    float blueOffset = strength * dist * 0.012;
                    
                    float r = texture2D(tex, uv + direction * redOffset).r;
                    float g = texture2D(tex, uv + direction * greenOffset).g;
                    float b = texture2D(tex, uv - direction * blueOffset).b;
                    
                    return vec3(r, g, b);
                }
                
                // Scanlines effect (thinner lines)
                float scanlines(vec2 uv, float intensity, float time) {
                    if (intensity <= 0.0) return 1.0;
                    
                    float scanline = sin(uv.y * 1200.0 + time * 2.0) * 0.5 + 0.5; // Increased frequency for thinner lines
                    scanline = pow(scanline, 5.0); // Higher power for sharper, thinner lines
                    return mix(1.0, 0.8 + scanline * 0.2, intensity); // Reduced contrast for subtlety
                }
                
                void main() {
                    vec2 uv = vUv;
                    
                    if (!uEnabled) {
                        gl_FragColor = texture2D(tDiffuse, uv);
                        return;
                    }
                    
                    // Apply lens distortion
                    if (uLensDistortion != 0.0) {
                        uv = lensDistortion(uv, uLensDistortion);
                        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                            return;
                        }
                    }
                    
                    // Get base color with chromatic aberration first, then enhance with color fringing
                    vec3 color;
                    if (uChromaticAberration > 0.0) {
                        // Apply basic chromatic aberration first
                        vec2 offset = (uv - 0.5) * uChromaticAberration * 0.01;
                        color.r = texture2D(tDiffuse, uv + offset).r;
                        color.g = texture2D(tDiffuse, uv).g;
                        color.b = texture2D(tDiffuse, uv - offset).b;
                    } else {
                        color = texture2D(tDiffuse, uv).rgb;
                    }
                    
                    // Apply additional color fringing on top if enabled
                    if (uColorFringing > 0.0) {
                        vec3 fringingColor = colorFringing(tDiffuse, uv, uColorFringing);
                        // Blend the fringing effect with existing chromatic aberration
                        color = mix(color, fringingColor, uColorFringing * 0.5);
                    }
                    
                    // Apply exposure
                    color *= uExposure;
                    
                    // Apply tone mapping
                    if (uToneMapping == 1) {
                        color = acesFilmicToneMapping(color);
                    } else if (uToneMapping == 2) {
                        color = reinhardToneMapping(color);
                    } else if (uToneMapping == 3) {
                        color = uncharted2ToneMapping(color);
                    }
                    
                    // Apply lift gamma gain
                    color = liftGammaGain(color, uLift, uGammaRGB, uGain);
                    
                    // Apply gamma correction
                    color = pow(color, vec3(1.0 / uGamma));
                    
                    // Apply contrast
                    color = (color - 0.5) * uContrast + 0.5;
                    
                    // Apply saturation
                    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                    color = mix(vec3(luminance), color, uSaturation);
                    
                    // Apply vibrance
                    if (uVibrance != 0.0) {
                        color = adjustVibrance(color, uVibrance);
                    }
                    
                    // Apply color temperature and tint
                    if (uColorTemperature != 6500.0 || uTint != 0.0) {
                        vec3 tempColor = colorTemperatureToRGB(uColorTemperature);
                        color *= tempColor;
                        
                        // Apply tint (magenta/green shift)
                        color.r += uTint * 0.1;
                        color.b -= uTint * 0.1;
                    }
                    
                    // Apply vignette
                    if (uVignetteStrength > 0.0) {
                        vec2 center = uv - 0.5;
                        float vignette = 1.0 - smoothstep(0.3, 0.8, length(center));
                        vignette = mix(1.0, vignette, uVignetteStrength);
                        color *= vignette;
                    }
                    
                    // Apply efficient texture-based film grain
                    if (uFilmGrainIntensity > 0.0) {
                        // Generate efficient grain using pre-generated texture
                        float grain = filmGrain(uv, uTime);
                        
                        // Normalize grain to [-0.5, 0.5] range for better control
                        grain = (grain - 0.5);
                        
                        // Apply luminance-dependent grain intensity (more grain in shadows, less in highlights)
                        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
                        float grainStrength = mix(2.0, 0.8, smoothstep(0.0, 1.0, luminance));
                        
                        // Apply grain with much higher visibility
                        float finalGrain = grain * uFilmGrainIntensity * grainStrength * 0.25;
                        
                        // Add grain to color channels
                        color = color + vec3(finalGrain);
                        color = clamp(color, vec3(0.0), vec3(1.0));
                    }
                    
                    // Apply film halation (glow effect) - now works with processed color
                    if (uFilmHalation > 0.0) {
                        color = filmHalation(color, tDiffuse, uv, uFilmHalation);
                    }
                    
                    // Apply film scratches and damage
                    if (uFilmScratches > 0.0) {
                        float damage = filmScratches(uv, uTime, uFilmScratches);
                        color *= damage;
                    }
                    
                    // Apply scanlines effect (now thinner)
                    if (uScanlines > 0.0) {
                        float scanlineEffect = scanlines(uv, uScanlines, uTime);
                        color *= scanlineEffect;
                    }
                    
                    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
                }
            `
        };
    }
    
    updateUniforms() {
        if (this.filmicPass) {
            // Advanced mode with EffectComposer
            const uniforms = this.filmicPass.uniforms;
            
            uniforms.uEnabled.value = this.settings.enabled;
            uniforms.uToneMapping.value = this.getToneMappingIndex();
            uniforms.uExposure.value = this.settings.exposure;
            uniforms.uContrast.value = this.settings.contrast;
            uniforms.uSaturation.value = this.settings.saturation;
            uniforms.uVibrance.value = this.settings.vibrance;
            uniforms.uGamma.value = this.settings.gamma;
            
            uniforms.uLift.value.set(this.settings.lift.r, this.settings.lift.g, this.settings.lift.b);
            uniforms.uGammaRGB.value.set(this.settings.gammaRGB.r, this.settings.gammaRGB.g, this.settings.gammaRGB.b);
            uniforms.uGain.value.set(this.settings.gain.r, this.settings.gain.g, this.settings.gain.b);
            
            uniforms.uFilmGrainIntensity.value = this.settings.filmGrainIntensity;
            uniforms.uVignetteStrength.value = this.settings.vignetteStrength;
            uniforms.uChromaticAberration.value = this.settings.chromaticAberration;
            uniforms.uLensDistortion.value = this.settings.lensDistortion;
            
            // Advanced Cinematic Effects
            uniforms.uFilmHalation.value = this.settings.filmHalation;
            uniforms.uFilmScratches.value = this.settings.filmScratches;
            uniforms.uColorFringing.value = this.settings.colorFringing;
            uniforms.uScanlines.value = this.settings.scanlines;
            
            uniforms.uColorTemperature.value = this.settings.colorTemperature;
            uniforms.uTint.value = this.settings.tint;
            
            uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        } else {
            // Fallback mode - use Three.js built-in tone mapping
            this.updateBuiltInToneMapping();
        }
    }
    
    updateBuiltInToneMapping() {
        if (!this.settings.enabled) {
            // Reset to original values when disabled
            this.renderer.toneMapping = this.originalToneMapping;
            this.renderer.toneMappingExposure = this.originalToneMappingExposure;
            return;
        }
        
        // Apply tone mapping using Three.js built-in options
        switch (this.settings.toneMapping) {
            case 'aces':
                this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
                break;
            case 'reinhard':
                this.renderer.toneMapping = THREE.ReinhardToneMapping;
                break;
            case 'uncharted2':
                this.renderer.toneMapping = THREE.CineonToneMapping; // Close approximation
                break;
            case 'linear':
            default:
                this.renderer.toneMapping = THREE.LinearToneMapping;
                break;
        }
        
        // Apply exposure
        this.renderer.toneMappingExposure = this.settings.exposure;
    }
    
    getToneMappingIndex() {
        switch (this.settings.toneMapping) {
            case 'aces': return 1;
            case 'reinhard': return 2;
            case 'uncharted2': return 3;
            default: return 0; // linear
        }
    }
    
    render(deltaTime) {
        if (this.settings.enabled && this.composer) {
            // Advanced mode with EffectComposer
            if (this.filmicPass) {
                this.filmicPass.uniforms.uTime.value += deltaTime;
                
                // Regenerate grain texture occasionally for subtle animation (every ~0.3 seconds)
                if (this.settings.filmGrainIntensity > 0.0 && 
                    Math.floor(this.filmicPass.uniforms.uTime.value * 3) !== Math.floor((this.filmicPass.uniforms.uTime.value - deltaTime) * 3)) {
                    this.regenerateGrainTexture();
                }
            }
            this.updateUniforms();
            try {
                this.composer.render();
                // Apply full viewport overlays for UI elements in advanced mode
                this.applyFullViewportOverlays();
            } catch (error) {
                console.error('❌ EffectComposer.render() failed:', error);
                // Fallback to normal rendering
                this.renderer.render(this.scene, this.camera);
                this.applyFullViewportOverlays();
            }
        } else if (this.settings.enabled && !this.composer) {
            // Fallback mode (applies filters to entire body + overlays)
            this.updateBuiltInToneMapping();
            this.applyCSSFallback();
            this.renderer.render(this.scene, this.camera);
        } else {
            // Disabled - remove effects
            this.removeCSSFallback();
            this.removeFullViewportOverlays();
            if (!this.composer) {
                // Reset tone mapping when disabled
                this.renderer.toneMapping = this.originalToneMapping;
                this.renderer.toneMappingExposure = this.originalToneMappingExposure;
            }
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    applyCSSFallback() {
        // Apply basic filmic effects using CSS filters to entire viewport
        // This includes canvas, debug console, track info, and all UI elements
        const bodyElement = document.body;
        let filterString = '';
        
        if (this.settings.exposure !== 1.0) {
            filterString += `brightness(${this.settings.exposure}) `;
        }
        
        if (this.settings.contrast !== 1.0) {
            filterString += `contrast(${this.settings.contrast}) `;
        }
        
        if (this.settings.saturation !== 1.0) {
            filterString += `saturate(${this.settings.saturation}) `;
        }
        
        // Approximate vibrance using saturation (not perfect but visible)
        if (this.settings.vibrance !== 0.0) {
            const vibranceEffect = 1.0 + (this.settings.vibrance * 0.3); // Scale down vibrance
            filterString += `saturate(${vibranceEffect}) `;
        }
        
        // Approximate gamma using brightness (limited approximation)
        if (this.settings.gamma !== 1.0) {
            const gammaEffect = Math.pow(1.0, 1.0 / this.settings.gamma);
            filterString += `brightness(${gammaEffect}) `;
        }
        
        if (this.settings.colorTemperature !== 6500) {
            // Simple temperature approximation
            const temp = this.settings.colorTemperature;
            if (temp < 6500) {
                // Warmer (more red/orange)
                const warmth = Math.min(1, (6500 - temp) / 2500);
                filterString += `sepia(${warmth * 0.3}) hue-rotate(${-warmth * 15}deg) `;
            } else {
                // Cooler (more blue)
                const coolness = Math.min(1, (temp - 6500) / 2500);
                filterString += `hue-rotate(${coolness * 30}deg) `;
            }
        }
        
        const finalFilter = filterString.trim() || 'none';
        bodyElement.style.filter = finalFilter;
        
        // Apply film grain using CSS overlay covering entire viewport
        if (this.settings.filmGrainIntensity > 0.0) {
            this.addFullViewportFilmGrainOverlay(this.settings.filmGrainIntensity);
        } else {
            this.removeFullViewportFilmGrainOverlay();
        }
        
        // Apply vignette effect using CSS gradient overlay covering entire viewport
        if (this.settings.vignetteStrength > 0.0) {
            this.addFullViewportVignetteOverlay(this.settings.vignetteStrength);
        } else {
            this.removeFullViewportVignetteOverlay();
        }
    }
    
    removeCSSFallback() {
        const bodyElement = document.body;
        bodyElement.style.filter = 'none';
        this.removeFullViewportFilmGrainOverlay();
        this.removeFullViewportVignetteOverlay();
    }
    
    onWindowResize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        
        if (this.filmicPass) {
            this.filmicPass.uniforms.uResolution.value.set(width, height);
        }
    }
    
    // Settings management for preset system
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }
    
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.updateUniforms();
    }
    
    resetToDefaults() {
        this.settings = {
            enabled: false,
            toneMapping: 'linear',
            exposure: 1.0,
            contrast: 1.0,
            saturation: 1.0,
            vibrance: 0.0,
            gamma: 1.0,
            lift: { r: 0.0, g: 0.0, b: 0.0 },
            gammaRGB: { r: 1.0, g: 1.0, b: 1.0 },
            gain: { r: 1.0, g: 1.0, b: 1.0 },
            filmGrainIntensity: 0.0,
            vignetteStrength: 0.0,
            chromaticAberration: 0.0,
            lensDistortion: 0.0,
            
            // Advanced Cinematic Effects
            filmHalation: 0.0,
            filmScratches: 0.0,
            colorFringing: 0.0,
            scanlines: 0.0,
            
            colorTemperature: 6500,
            tint: 0.0,
            bloom: {
                enabled: false,
                strength: 0.3,
                radius: 0.4,
                threshold: 0.85
            }
        };
        this.updateUniforms();
    }
    
    // Synchronize UI controls with current settings
    syncUIControls() {
        // Enable checkbox
        const filmicEnabledToggle = document.getElementById('filmic-enabled');
        if (filmicEnabledToggle) {
            filmicEnabledToggle.checked = this.settings.enabled;
        }
        
        // Tone mapping dropdown
        const toneMappingSelect = document.getElementById('tone-mapping');
        if (toneMappingSelect) {
            toneMappingSelect.value = this.settings.toneMapping;
        }
        
        // All sliders and their value displays
        const controls = [
            { slider: 'filmic-exposure', value: 'filmic-exposure-value', setting: this.settings.exposure, decimals: 1 },
            { slider: 'filmic-contrast', value: 'filmic-contrast-value', setting: this.settings.contrast, decimals: 1 },
            { slider: 'filmic-saturation', value: 'filmic-saturation-value', setting: this.settings.saturation, decimals: 1 },
            { slider: 'filmic-vibrance', value: 'filmic-vibrance-value', setting: this.settings.vibrance, decimals: 1 },
            { slider: 'filmic-gamma', value: 'filmic-gamma-value', setting: this.settings.gamma, decimals: 1 },
            { slider: 'film-grain-intensity', value: 'film-grain-intensity-value', setting: this.settings.filmGrainIntensity, decimals: 2 },
            { slider: 'vignette-strength', value: 'vignette-strength-value', setting: this.settings.vignetteStrength, decimals: 2 },
            { slider: 'chromatic-aberration', value: 'chromatic-aberration-value', setting: this.settings.chromaticAberration, decimals: 1 },
            { slider: 'lens-distortion', value: 'lens-distortion-value', setting: this.settings.lensDistortion, decimals: 2 },
            
            // Advanced Cinematic Effects
            { slider: 'film-halation', value: 'film-halation-value', setting: this.settings.filmHalation, decimals: 2 },
            { slider: 'film-scratches', value: 'film-scratches-value', setting: this.settings.filmScratches, decimals: 2 },
            { slider: 'color-fringing', value: 'color-fringing-value', setting: this.settings.colorFringing, decimals: 2 },
            { slider: 'scanlines', value: 'scanlines-value', setting: this.settings.scanlines, decimals: 2 },
            
            { slider: 'color-temperature', value: 'color-temperature-value', setting: this.settings.colorTemperature, decimals: 0 },
            { slider: 'color-tint', value: 'color-tint-value', setting: this.settings.tint, decimals: 1 }
        ];
        
        controls.forEach(control => {
            const slider = document.getElementById(control.slider);
            const valueDisplay = document.getElementById(control.value);
            
            if (slider) {
                slider.value = control.setting;
            }
            if (valueDisplay) {
                valueDisplay.textContent = control.setting.toFixed(control.decimals);
            }
        });
        
        // Update UI availability based on current mode
        this.updateUIAvailability();
    }
    
    // Update UI to show which effects are available in current mode
    updateUIAvailability() {
        const isAdvancedMode = !!this.composer;
        
        // Shader-only controls that should be disabled in fallback mode
        const shaderOnlyControls = [
            'chromatic-aberration',
            'lens-distortion',
            'film-halation',
            'film-scratches',
            'color-fringing',
            'scanlines'
        ];
        
        shaderOnlyControls.forEach(controlId => {
            const slider = document.getElementById(controlId);
            const valueDisplay = document.getElementById(controlId + '-value');
            
            if (slider) {
                slider.disabled = !isAdvancedMode;
                slider.style.opacity = isAdvancedMode ? '1' : '0.5';
                slider.title = isAdvancedMode ? '' : 'Requires EffectComposer for advanced shader effects';
            }
            
            if (valueDisplay) {
                valueDisplay.style.opacity = isAdvancedMode ? '1' : '0.5';
            }
        });
        
        // Update the shader-only indicators
        const shaderIndicators = document.querySelectorAll('.shader-only');
        shaderIndicators.forEach(indicator => {
            indicator.style.color = isAdvancedMode ? '#4CAF50' : '#ffa500';
            indicator.title = isAdvancedMode ? 
                'Advanced shader effects available' : 
                'Requires EffectComposer - not available in fallback mode';
        });
    }

    addFilmGrainOverlay(intensity) {
        // Remove existing film grain overlay
        this.removeFilmGrainOverlay();
        
        const canvas = this.renderer.domElement;
        const grainOverlay = document.createElement('div');
        grainOverlay.id = 'filmic-grain-overlay';
        
        // Create efficient static noise pattern using CSS
        const opacity = Math.min(0.4, intensity * 0.8); // Higher opacity for visibility
        
        grainOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: ${opacity};
            background: 
                radial-gradient(circle at 25% 25%, transparent 15%, rgba(255,255,255,0.6) 16%, rgba(255,255,255,0.6) 17%, transparent 18%, transparent),
                radial-gradient(circle at 75% 75%, transparent 15%, rgba(0,0,0,0.4) 16%, rgba(0,0,0,0.4) 17%, transparent 18%, transparent),
                linear-gradient(45deg, rgba(255,255,255,0.2), transparent 50%, rgba(255,255,255,0.2)),
                linear-gradient(-45deg, rgba(0,0,0,0.15), transparent 50%, rgba(0,0,0,0.15));
            background-size: 3px 3px, 4px 4px, 2px 2px, 2px 2px;
            z-index: 1000;
            mix-blend-mode: overlay;
        `;
        
        canvas.parentElement.style.position = 'relative';
        canvas.parentElement.appendChild(grainOverlay);
        
        // Much less frequent updates for efficiency
        this.grainRefreshInterval = setInterval(() => {
            if (document.getElementById('filmic-grain-overlay')) {
                // More noticeable movement for visibility
                const element = document.getElementById('filmic-grain-overlay');
                if (element) {
                    const x = Math.random() * 4 - 2;
                    const y = Math.random() * 4 - 2;
                    element.style.backgroundPosition = `${x}px ${y}px, ${x * 0.5}px ${y * 0.5}px, 0 0, 0 0`;
                }
            }
        }, 150); // Slightly faster for more visible movement
    }
    
    removeFilmGrainOverlay() {
        const existing = document.getElementById('filmic-grain-overlay');
        if (existing) {
            existing.remove();
        }
        
        // Clear the grain refresh interval for TV static effect
        if (this.grainRefreshInterval) {
            clearInterval(this.grainRefreshInterval);
            this.grainRefreshInterval = null;
        }
    }
    
    // Full viewport film grain overlay (covers entire screen including UI) - EFFICIENT VERSION
    addFullViewportFilmGrainOverlay(intensity) {
        // Remove existing film grain overlay
        this.removeFullViewportFilmGrainOverlay();
        
        const grainOverlay = document.createElement('div');
        grainOverlay.id = 'filmic-grain-overlay-fullscreen';
        
        // Create efficient static noise pattern using CSS
        const opacity = Math.min(0.4, intensity * 0.8); // Higher opacity for visibility
        
        grainOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            opacity: ${opacity};
            background: 
                radial-gradient(circle at 25% 25%, transparent 15%, rgba(255,255,255,0.6) 16%, rgba(255,255,255,0.6) 17%, transparent 18%, transparent),
                radial-gradient(circle at 75% 75%, transparent 15%, rgba(0,0,0,0.4) 16%, rgba(0,0,0,0.4) 17%, transparent 18%, transparent),
                linear-gradient(45deg, rgba(255,255,255,0.2), transparent 50%, rgba(255,255,255,0.2)),
                linear-gradient(-45deg, rgba(0,0,0,0.15), transparent 50%, rgba(0,0,0,0.15));
            background-size: 3px 3px, 4px 4px, 2px 2px, 2px 2px;
            z-index: 1950;
            mix-blend-mode: overlay;
        `;
        
        document.body.appendChild(grainOverlay);
        
        // Much less frequent updates for efficiency
        this.grainRefreshIntervalFullscreen = setInterval(() => {
            if (document.getElementById('filmic-grain-overlay-fullscreen')) {
                // More noticeable movement for visibility
                const element = document.getElementById('filmic-grain-overlay-fullscreen');
                if (element) {
                    const x = Math.random() * 4 - 2;
                    const y = Math.random() * 4 - 2;
                    element.style.backgroundPosition = `${x}px ${y}px, ${x * 0.5}px ${y * 0.5}px, 0 0, 0 0`;
                }
            }
        }, 150); // Slightly faster for more visible movement
    }
    
    removeFullViewportFilmGrainOverlay() {
        const existing = document.getElementById('filmic-grain-overlay-fullscreen');
        if (existing) {
            existing.remove();
        }
        
        // Clear the grain refresh interval for TV static effect
        if (this.grainRefreshIntervalFullscreen) {
            clearInterval(this.grainRefreshIntervalFullscreen);
            this.grainRefreshIntervalFullscreen = null;
        }
    }
    
    // Full viewport vignette overlay (covers entire screen including UI)
    addFullViewportVignetteOverlay(strength) {
        // Remove existing vignette overlay
        this.removeFullViewportVignetteOverlay();
        
        const vignetteOverlay = document.createElement('div');
        vignetteOverlay.id = 'filmic-vignette-overlay-fullscreen';
        vignetteOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            background: radial-gradient(ellipse at center, 
                transparent 30%, 
                rgba(0,0,0,${strength * 0.3}) 70%, 
                rgba(0,0,0,${strength * 0.6}) 100%);
            z-index: 1940;
            mix-blend-mode: multiply;
        `;
        
        document.body.appendChild(vignetteOverlay);
    }
    
    removeFullViewportVignetteOverlay() {
        const existing = document.getElementById('filmic-vignette-overlay-fullscreen');
        if (existing) {
            existing.remove();
        }
    }
    
    // Keep the original canvas-specific functions for backwards compatibility
    // (these are used when advanced mode is unavailable but we still want canvas effects)
    addFilmGrainOverlayCanvas(intensity) {
        // Remove existing film grain overlay
        this.removeFilmGrainOverlayCanvas();
        
        const canvas = this.renderer.domElement;
        const ctx = canvas.getContext('2d');
        
        // Fine grain similar to TV static
        const opacity = Math.min(0.25, intensity * 0.7); // Subtle opacity
        const baseSize = 8; // Very fine grain size
        
        // Create TV static-like noise patterns with rapid changing
        const staticNoise1 = this.generateStaticNoisePattern(baseSize, opacity * 0.8, 2.8, 2);
        const staticNoise2 = this.generateStaticNoisePattern(baseSize * 0.7, opacity * 0.6, 3.5, 1);
        
        // Composite the noise patterns onto the canvas
        ctx.globalAlpha = 1.0;
        ctx.drawImage(staticNoise1, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(staticNoise2, 0, 0, canvas.width, canvas.height);
        
        // Set blend mode to overlay for authentic film grain look
        ctx.globalCompositeOperation = 'overlay';
        
        // Optional: Add a subtle motion blur to the grain for realism
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(staticNoise1, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(staticNoise2, 0, 0, canvas.width, canvas.height);
        
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'source-over';
    }
    
    removeFilmGrainOverlayCanvas() {
        const canvas = this.renderer.domElement;
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    generateStaticNoisePattern(size, opacity, baseFrequency, numOctaves) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
        
        // Generate Perlin-like noise
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const nx = x / size - 0.5;
                const ny = y / size - 0.5;
                
                // Simplex noise or Perlin noise function can be used here
                const noiseValue = this.simplexNoise(nx * baseFrequency, ny * baseFrequency, numOctaves);
                const grayscale = (noiseValue + 1) / 2; // Normalize to [0, 1]
                
                const cell = (x + y * size) * 4;
                data[cell] = grayscale * 255;     // R
                data[cell + 1] = grayscale * 255; // G
                data[cell + 2] = grayscale * 255; // B
                data[cell + 3] = 255;             // A
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
    
    simplexNoise(x, y, octaves) {
        // Placeholder for simplex noise function
        // Implement or import a simplex noise function here
        return Math.random() * 2 - 1; // Random noise in [-1, 1]
    }
    
    // Create efficient pre-generated grain texture
    createGrainTexture() {
        if (this.grainTexture) {
            this.grainTexture.dispose();
        }
        
        const size = this.grainTextureSize;
        const data = new Uint8Array(size * size);
        
        // Generate true random noise (no patterns)
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 255;
        }
        
        // Create texture
        this.grainTexture = new THREE.DataTexture(data, size, size, THREE.RedFormat);
        this.grainTexture.wrapS = THREE.RepeatWrapping;
        this.grainTexture.wrapT = THREE.RepeatWrapping;
        this.grainTexture.magFilter = THREE.LinearFilter;
        this.grainTexture.minFilter = THREE.LinearFilter;
        this.grainTexture.needsUpdate = true;
        
        return this.grainTexture;
    }
    
    // Regenerate grain texture for subtle animation
    regenerateGrainTexture() {
        if (!this.grainTexture) return;
        
        const size = this.grainTextureSize;
        const data = new Uint8Array(size * size);
        
        // Generate new random noise
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.random() * 255;
        }
        
        // Update existing texture data
        this.grainTexture.image = { data: data, width: size, height: size };
        this.grainTexture.needsUpdate = true;
    }
    
    // Apply only overlays (for advanced mode - canvas gets shader effects, UI gets overlays)
    applyFullViewportOverlays() {
        // Apply film grain using full viewport overlay
        if (this.settings.filmGrainIntensity > 0.0) {
            this.addFullViewportFilmGrainOverlay(this.settings.filmGrainIntensity);
        } else {
            this.removeFullViewportFilmGrainOverlay();
        }
        
        // Apply vignette effect using full viewport overlay
        if (this.settings.vignetteStrength > 0.0) {
            this.addFullViewportVignetteOverlay(this.settings.vignetteStrength);
        } else {
            this.removeFullViewportVignetteOverlay();
        }
    }
    
    // Remove all full viewport overlays
    removeFullViewportOverlays() {
        this.removeFullViewportFilmGrainOverlay();
        this.removeFullViewportVignetteOverlay();
    }
}
