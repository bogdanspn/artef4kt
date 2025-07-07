/**
 * Orbital Blob System
 * Creates dedicated orbital blobs that maintain stable orbits around the main ferrofluid blob
 * Features different orbital patterns, slower movement, and longer lifespans
 */

class OrbitalBlobSystem {
    /**
     * Helper function to generate random rotation speed with minimum threshold
     * Ensures all blobs have some rotational movement
     */
    randomRotationSpeed(min, max) {
        const range = max - min;
        const randomValue = Math.random() * range + min;
        return Math.random() < 0.5 ? -randomValue : randomValue;
    }

    constructor(ferrofluidVisualizer) {
        this.visualizer = ferrofluidVisualizer;
        this.scene = ferrofluidVisualizer.scene;
        this.orbitalBlobs = [];
        
        // Orbital system configuration
        this.config = {
            maxOrbitalBlobs: 4,           // Maximum number of orbital blobs
            spawnCooldown: 3000,          // 3 seconds between spawns
            baseOrbitRadius: 6.0,         // Base orbit radius from main blob
            radiusVariation: 2.0,         // ±2.0 variation in orbit radius
            orbitSpeed: {
                min: 0.3,                 // Minimum orbit speed multiplier
                max: 0.8                  // Maximum orbit speed multiplier
            },
            baseLifespan: 25,             // Base lifespan in seconds
            lifespanVariation: 10,        // ±10 seconds variation
            blobSize: {
                min: 0.15,                // Minimum blob size
                max: 0.35                 // Maximum blob size
            }
        };
        
        // System state
        this.lastSpawnTime = 0;
        this.systemActive = true;
        
        // Different orbital patterns
        this.orbitPatterns = [
            'circular',      // Simple circular orbit
            'elliptical',    // Elliptical orbit
            'precessing',    // Circular orbit with precession
            'figure8'        // Figure-8 orbital pattern
        ];
        
        // Initialize orbital blobs
        // Initialize skip flag for performance optimization
        this.skipOrbitalUpdate = false;
        
        this.initializeOrbitalBlobs();
        
        console.log('Orbital Blob System initialized');
    }
    
    /**
     * Initialize the orbital blob system with starting blobs
     */
    initializeOrbitalBlobs() {
        // Start with 2 orbital blobs
        for (let i = 0; i < 2; i++) {
            setTimeout(() => {
                this.spawnOrbitalBlob();
            }, i * 1000); // Stagger initial spawns by 1 second
        }
    }
    
    /**
     * Spawn a new orbital blob
     */
    spawnOrbitalBlob() {
        if (this.orbitalBlobs.length >= this.config.maxOrbitalBlobs) {
            return null;
        }
          // Generate orbital parameters
        const orbitRadius = this.config.baseOrbitRadius + 
                           (Math.random() - 0.5) * 2 * this.config.radiusVariation;
        
        const baseOrbitSpeed = this.config.orbitSpeed.min + 
                              Math.random() * (this.config.orbitSpeed.max - this.config.orbitSpeed.min);
        
        // Add opposite direction rotation (like electrons around a nucleus)
        const rotationDirection = Math.random() < 0.5 ? 1 : -1; // 50% chance for each direction
        const orbitSpeed = baseOrbitSpeed * rotationDirection;
        
        const blobSize = this.config.blobSize.min + 
                        Math.random() * (this.config.blobSize.max - this.config.blobSize.min);
        
        const pattern = this.orbitPatterns[Math.floor(Math.random() * this.orbitPatterns.length)];
        
        // Calculate initial position
        const initialAngle = Math.random() * Math.PI * 2;
        const orbitInclination = (Math.random() - 0.5) * Math.PI * 0.4; // ±36 degrees
        
        // Create initial position on orbit
        const initialPosition = this.calculateOrbitPosition(
            orbitRadius, initialAngle, orbitInclination, 0, pattern
        );
        
        // Create the blob geometry and material
        const geometry = new THREE.SphereGeometry(blobSize, 44, 24);
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            metalness: 1.0,
            roughness: 0.2,
            reflectivity: 0.3,
            clearcoat: 0.4,
            clearcoatRoughness: 1.3,
            envMapIntensity: 1.2
        });
        
        const blob = new THREE.Mesh(geometry, material);
        blob.position.copy(initialPosition);
        blob.castShadow = true;
        blob.receiveShadow = true;
        
        // Create inner core (like main ferrofluid)
        const innerGeometry = new THREE.SphereGeometry(blobSize * 0.7, 16, 16);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide
        });
        const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
        innerCore.position.copy(initialPosition);
        
        // Create orbital blob data
        const orbitalBlobData = {
            mesh: blob,
            innerCore: innerCore,
            geometry: geometry,            // Orbital parameters
            orbitRadius: orbitRadius,
            baseOrbitRadius: orbitRadius, // Store original radius for dynamic expansion calculations
            smoothedRadius: orbitRadius,  // For smooth radius transitions
            orbitSpeed: orbitSpeed,
            orbitDirection: rotationDirection, // Track rotation direction for logging
            orbitAngle: initialAngle,
            orbitInclination: orbitInclination,
            pattern: pattern,
            
            // Pattern-specific parameters
            ellipseEccentricity: 0.3 + Math.random() * 0.4, // 0.3-0.7 for elliptical orbits
            precessionRate: 0.1 + Math.random() * 0.2,      // For precessing orbits
            figure8Scale: 0.8 + Math.random() * 0.4,        // For figure-8 pattern
            
            // Physics and animation
            size: blobSize,
            baseSize: blobSize,
            currentScale: 1.0,
            rotationVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ),
            
            // Lifetime management
            maxLife: this.config.baseLifespan + (Math.random() - 0.5) * 2 * this.config.lifespanVariation,
            life: 1.0,
            
            // Visual effects
            phase: Math.random() * Math.PI * 2,
            musicResponse: 0.3 + Math.random() * 0.2, // Reduced music response for stability
              // Deformation system - ENHANCED with main ferrofluid's sophisticated system
            originalPositions: geometry.attributes.position.array.slice(),
            targetPositions: new Float32Array(geometry.attributes.position.array.length),
            currentPositions: new Float32Array(geometry.attributes.position.array.length),
            morphIntensity: 0.15 + Math.random() * 0.1, // Enhanced deformation intensity
            
            // Enhanced noise offsets for organic movement (like main ferrofluid)
            noiseOffsets: [],
            
            // Enhanced music response parameters (like floating blobs)
            bassPhaseOffset: Math.random() * Math.PI * 2,
            midPhaseOffset: Math.random() * Math.PI * 2,
            highPhaseOffset: Math.random() * Math.PI * 2,
            bassTimingMultiplier: 0.8 + Math.random() * 0.4,
            midTimingMultiplier: 0.7 + Math.random() * 0.6,
            highTimingMultiplier: 0.6 + Math.random() * 0.8,
            deformationSpeed: 0.6 + Math.random() * 0.8,
            
            // Orbital timing
            orbitTime: 0,
            independentTimer: Math.random() * 10
        };
          // Initialize deformation arrays
        for (let i = 0; i < orbitalBlobData.originalPositions.length; i++) {
            orbitalBlobData.currentPositions[i] = orbitalBlobData.originalPositions[i];
            orbitalBlobData.targetPositions[i] = orbitalBlobData.originalPositions[i];
        }
        
        // Initialize enhanced noise offsets for organic movement (like main ferrofluid)
        for (let i = 0; i < orbitalBlobData.originalPositions.length / 3; i++) {
            orbitalBlobData.noiseOffsets.push({
                x: Math.random() * 1000,
                y: Math.random() * 1000,
                z: Math.random() * 1000,
                speed: 0.5 + Math.random() * 0.5
            });
        }
        
        // Add to scene and tracking array
        this.scene.add(blob);
        this.scene.add(innerCore);
        this.orbitalBlobs.push(orbitalBlobData);
        
        // Trigger GPU particle effects if available
        if (this.visualizer.gpuParticleSystem) {
            this.visualizer.gpuParticleSystem.createParticleBurst(initialPosition, {
                particleCount: Math.floor(30 + Math.random() * 40), // 30-70 particles
                spreadRadius: 0.3 + Math.random() * 0.4,
                speed: 0.8 + Math.random() * 0.6,
                particleType: 'orbital'
            });
        }
        
        console.log(`🛸 Orbital blob spawned: ${pattern} orbit, radius: ${orbitRadius.toFixed(2)}, speed: ${orbitSpeed.toFixed(2)} (${rotationDirection > 0 ? 'clockwise' : 'counterclockwise'})`);
        
        return orbitalBlobData;
    }
    
    /**
     * Calculate orbital position based on pattern and parameters
     */
    calculateOrbitPosition(radius, angle, inclination, time, pattern, patternParams = {}) {
        let x, y, z;
        
        // Get main ferrofluid position (accounting for its floating movement)
        const mainBlobPos = this.visualizer.ferrofluid ? 
                           this.visualizer.ferrofluid.position : 
                           new THREE.Vector3(0, 0, 0);
        
        switch (pattern) {
            case 'circular':
                x = Math.cos(angle) * radius;
                y = Math.sin(angle * 0.3) * radius * 0.2; // Slight vertical variation
                z = Math.sin(angle) * radius;
                break;
                
            case 'elliptical':
                const eccentricity = patternParams.eccentricity || 0.5;
                const ellipseA = radius;
                const ellipseB = radius * (1 - eccentricity);
                x = Math.cos(angle) * ellipseA;
                y = Math.sin(angle * 0.5) * radius * 0.3;
                z = Math.sin(angle) * ellipseB;
                break;
                
            case 'precessing':
                const precessionAngle = time * (patternParams.precessionRate || 0.15);
                const localX = Math.cos(angle) * radius;
                const localZ = Math.sin(angle) * radius;
                x = localX * Math.cos(precessionAngle) - localZ * Math.sin(precessionAngle);
                y = Math.sin(angle * 0.4 + time * 0.3) * radius * 0.25;
                z = localX * Math.sin(precessionAngle) + localZ * Math.cos(precessionAngle);
                break;
                
            case 'figure8':
                const scale = patternParams.figure8Scale || 1.0;
                x = Math.sin(angle) * radius * scale;
                y = Math.sin(angle * 2) * radius * 0.4 * scale;
                z = Math.sin(angle * 0.5) * radius * 0.8 * scale;
                break;
                
            default:
                x = Math.cos(angle) * radius;
                y = 0;
                z = Math.sin(angle) * radius;
        }
        
        // Apply inclination
        const cosInc = Math.cos(inclination);
        const sinInc = Math.sin(inclination);
        const rotatedY = y * cosInc - z * sinInc;
        const rotatedZ = y * sinInc + z * cosInc;
        
        // Add main blob position offset
        return new THREE.Vector3(
            mainBlobPos.x + x,
            mainBlobPos.y + rotatedY,
            mainBlobPos.z + rotatedZ
        );
    }
    
    /**
     * Update all orbital blobs
     */
    update(deltaTime) {
        if (!this.systemActive) return;
        
        // Performance optimization: Skip updates during very intense music to prevent freezing
        const totalMusicInfluence = this.visualizer.bassIntensity + 
                                   this.visualizer.midIntensity + 
                                   this.visualizer.highIntensity;
        
        if (totalMusicInfluence > 0.9) {
            this.skipOrbitalUpdate = !this.skipOrbitalUpdate;
            if (this.skipOrbitalUpdate) return;
        }
        
        // Update existing orbital blobs
        for (let i = this.orbitalBlobs.length - 1; i >= 0; i--) {
            const orbitalData = this.orbitalBlobs[i];
            
            // Update timers
            orbitalData.orbitTime += deltaTime;
            orbitalData.independentTimer += deltaTime;
            
            // Update orbital position
            this.updateOrbitalPosition(orbitalData, deltaTime);
            
            // Update visual effects
            this.updateOrbitalVisuals(orbitalData, deltaTime);
            
            // Update lifetime
            orbitalData.life -= deltaTime / orbitalData.maxLife;
            
            // Handle orbital blob aging and removal
            if (orbitalData.life <= 0) {
                this.removeOrbitalBlob(i);
                continue;
            }
            
            // Handle fade-out in final 20% of life
            if (orbitalData.life < 0.2) {
                const fadeAmount = orbitalData.life / 0.2;
                orbitalData.mesh.material.opacity = fadeAmount;
                orbitalData.mesh.material.transparent = true;
                orbitalData.currentScale = fadeAmount;
                orbitalData.mesh.scale.setScalar(orbitalData.currentScale);
                orbitalData.innerCore.scale.setScalar(orbitalData.currentScale * 0.7);
            }
        }
        
        // Spawn new orbital blobs if needed
        this.manageOrbitalSpawning();
    }
      /**
     * Update orbital position based on pattern
     */    updateOrbitalPosition(orbitalData, deltaTime) {
        // Calculate music-reactive acceleration
        const totalMusicInfluence = this.visualizer.bassIntensity + 
                                   this.visualizer.midIntensity + 
                                   this.visualizer.highIntensity;
        
        // Create acceleration multiplier based on music intensity
        // Base speed: 1.0, can accelerate up to 2.5x during intense music
        const musicAcceleration = 1.0 + (totalMusicInfluence * 1.5);
        const acceleratedSpeed = orbitalData.orbitSpeed * musicAcceleration;
        
        // Update orbit angle based on accelerated speed
        orbitalData.orbitAngle += acceleratedSpeed * deltaTime;
        
        // Calculate dynamic orbit radius based on main blob's high-frequency spiking
        // High frequencies create more dramatic spikes, so they should push orbits outward
        const highFreqInfluence = this.visualizer.highIntensity;
        const midFreqBoost = this.visualizer.midIntensity * 0.3; // Smaller influence from mid frequencies
        const spikingIntensity = highFreqInfluence + midFreqBoost;
        
        // Create radius expansion: base radius can expand up to 1.8x during intense spiking
        const radiusExpansionMultiplier = 1.0 + (spikingIntensity * 0.8);
        const currentRadius = orbitalData.baseOrbitRadius * radiusExpansionMultiplier;
        
        // Smooth the radius changes to avoid jarring jumps
        if (!orbitalData.smoothedRadius) {
            orbitalData.smoothedRadius = orbitalData.baseOrbitRadius;
        }
        orbitalData.smoothedRadius += (currentRadius - orbitalData.smoothedRadius) * 0.15;
        
        // Calculate new position using the dynamically adjusted radius
        const newPosition = this.calculateOrbitPosition(
            orbitalData.smoothedRadius,
            orbitalData.orbitAngle,
            orbitalData.orbitInclination,
            orbitalData.orbitTime,
            orbitalData.pattern,
            {
                eccentricity: orbitalData.ellipseEccentricity,
                precessionRate: orbitalData.precessionRate,
                figure8Scale: orbitalData.figure8Scale
            }
        );
        
        // Smooth transition to new position
        orbitalData.mesh.position.lerp(newPosition, 0.1);
        orbitalData.innerCore.position.copy(orbitalData.mesh.position);
        
        // Update rotation
        orbitalData.mesh.rotation.x += orbitalData.rotationVelocity.x;
        orbitalData.mesh.rotation.y += orbitalData.rotationVelocity.y;
        orbitalData.mesh.rotation.z += orbitalData.rotationVelocity.z;
        orbitalData.innerCore.rotation.copy(orbitalData.mesh.rotation);
    }
      /**
     * Update visual effects for orbital blobs with sophisticated deformation system
     */
    updateOrbitalVisuals(orbitalData, deltaTime) {
        // Get audio data for enhanced music response
        const bassInfluence = this.visualizer.bassIntensity * orbitalData.musicResponse * 0.7;
        const midInfluence = this.visualizer.midIntensity * orbitalData.musicResponse * 0.5;
        const highInfluence = this.visualizer.highIntensity * orbitalData.musicResponse * 0.4;
        const totalMusicInfluence = bassInfluence + midInfluence + highInfluence;
        
        // Enhanced deformation system using the main ferrofluid's sophisticated approach
        const geometry = orbitalData.geometry;
        const positions = geometry.attributes.position.array;
        const blobTime = orbitalData.independentTimer + orbitalData.phase;
        
        // Generate dynamic blob centers for enhanced spike generation (scaled for orbital blob)
        let blobCenters = [];
        if (totalMusicInfluence > 0.1) {
            blobCenters = this.generateOrbitalBlobCenters(blobTime, orbitalData);
        }
        
        let maxDeformation = 0;
        
        // Performance optimization: simplify deformation during intense music
        const simplifyDeformation = totalMusicInfluence > 0.8;
        const vertexStep = simplifyDeformation ? 2 : 1;
        
        // Apply sophisticated deformation to each vertex
        for (let j = 0; j < positions.length; j += 3 * vertexStep) {
            const vertexIndex = j / 3;
            
            // Skip if vertex doesn't exist (safety check for vertex stepping)
            if (vertexIndex >= orbitalData.originalPositions.length / 3) continue;
            const x = orbitalData.originalPositions[j];
            const y = orbitalData.originalPositions[j + 1];
            const z = orbitalData.originalPositions[j + 2];
            
            const vertexPos = new THREE.Vector3(x, y, z);
            
            // Enhanced base organic movement using noise with individual timing
            const noiseOffset = orbitalData.noiseOffsets[vertexIndex];
            const noiseX = x + blobTime * noiseOffset.speed * orbitalData.deformationSpeed;
            const noiseY = y + blobTime * noiseOffset.speed * 0.8 * orbitalData.deformationSpeed;
            const noiseZ = z + blobTime * noiseOffset.speed * 1.2 * orbitalData.deformationSpeed;
            const baseNoise = this.visualizer.noise3D(noiseX, noiseY, noiseZ) * 0.12;
            
            let musicDeformation = 0;
            
            // Enhanced music-reactive deformation using the main ferrofluid's approach
            if (blobCenters.length > 0) {
                // Use blob center system for sophisticated spike generation
                let totalBlobInfluence = 0;
                
                blobCenters.forEach(center => {
                    const dx = vertexPos.x - center.position.x;
                    const dy = vertexPos.y - center.position.y;
                    const dz = vertexPos.z - center.position.z;
                    const distanceSquared = dx * dx + dy * dy + dz * dz;
                    const radiusSquared = center.radius * center.radius;
                    
                    if (distanceSquared < radiusSquared * 4) {
                        const distance = Math.sqrt(distanceSquared);
                        const influence = Math.exp(-Math.pow(distance / center.radius, 2));
                        const blobDeformation = influence * center.intensity * center.strength;
                        totalBlobInfluence += blobDeformation;
                    }
                });
                
                musicDeformation = totalBlobInfluence * 0.8; // Slightly reduced for orbital blobs
            } else {
                // Fallback to individual frequency deformation with enhanced timing
                if (bassInfluence > 0.05) {
                    const bassTime = blobTime * 2 * orbitalData.bassTimingMultiplier * orbitalData.deformationSpeed;
                    const bassWave = Math.sin(bassTime + vertexPos.length() * 0.5 + orbitalData.bassPhaseOffset) * bassInfluence * 0.2;
                    musicDeformation += bassWave;
                }
                
                if (midInfluence > 0.03) {
                    const midTime = blobTime * 4 * orbitalData.midTimingMultiplier * orbitalData.deformationSpeed;
                    const midBump = Math.cos(midTime + vertexPos.x * 2 + vertexPos.z * 2 + orbitalData.midPhaseOffset) * midInfluence * 0.15;
                    musicDeformation += midBump;
                }
                
                if (highInfluence > 0.02) {
                    // Enhanced high frequency spikes with multiple patterns
                    const highTime1 = blobTime * 12 * orbitalData.highTimingMultiplier * orbitalData.deformationSpeed;
                    const highTime2 = blobTime * 8 * orbitalData.highTimingMultiplier * orbitalData.deformationSpeed;
                    const highTime3 = blobTime * 15 * orbitalData.highTimingMultiplier * orbitalData.deformationSpeed;
                    
                    const highSpike1 = Math.sin(highTime1 + vertexPos.length() * 10 + orbitalData.highPhaseOffset) * highInfluence * 0.25;
                    const highSpike2 = Math.cos(highTime2 + vertexPos.x * 6 + vertexPos.z * 6 + orbitalData.highPhaseOffset * 0.7) * highInfluence * 0.2;
                    const highSpike3 = Math.sin(highTime3 + vertexPos.y * 8 + orbitalData.highPhaseOffset * 1.3) * highInfluence * 0.15;
                    
                    musicDeformation += highSpike1 + highSpike2 + highSpike3;
                }
            }
            
            // Combine deformations with enhanced intensity
            const intensityMultiplier = orbitalData.morphIntensity * (0.8 + totalMusicInfluence * 1.0);
            const totalDeformation = (baseNoise + musicDeformation) * intensityMultiplier;
            
            // Track maximum deformation
            maxDeformation = Math.max(maxDeformation, Math.abs(totalDeformation));
            
            // Apply deformation along surface normal
            const normal = vertexPos.clone().normalize();
            orbitalData.targetPositions[j] = x + normal.x * totalDeformation;
            orbitalData.targetPositions[j + 1] = y + normal.y * totalDeformation;
            orbitalData.targetPositions[j + 2] = z + normal.z * totalDeformation;
            
            // Enhanced smooth interpolation with adaptive damping
            const baseDamping = 0.12;
            const highBoost = Math.min(highInfluence * 2, 0.15);
            const dampingFactor = baseDamping + highBoost;
            
            orbitalData.currentPositions[j] += (orbitalData.targetPositions[j] - orbitalData.currentPositions[j]) * dampingFactor;
            orbitalData.currentPositions[j + 1] += (orbitalData.targetPositions[j + 1] - orbitalData.currentPositions[j + 1]) * dampingFactor;
            orbitalData.currentPositions[j + 2] += (orbitalData.targetPositions[j + 2] - orbitalData.currentPositions[j + 2]) * dampingFactor;
            
            // Update geometry
            positions[j] = orbitalData.currentPositions[j];
            positions[j + 1] = orbitalData.currentPositions[j + 1];
            positions[j + 2] = orbitalData.currentPositions[j + 2];
        }
        
        // Store maximum deformation for potential future use
        orbitalData.maxDeformation = maxDeformation;
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Enhanced color changes based on music with orbital-specific tinting
        if (this.visualizer.isPlaying) {
            const totalInfluence = totalMusicInfluence;
            if (totalInfluence > 0.08) {
                const baseColor = 0x444444;
                const musicTint = Math.min(totalInfluence * 0.4, 0.2);
                
                // Add slight orbital-specific color variation
                const orbitalTint = Math.sin(orbitalData.orbitTime * 0.5) * 0.05;
                
                const r = ((baseColor >> 16) & 255) / 255;
                const g = ((baseColor >> 8) & 255) / 255;
                const b = (baseColor & 255) / 255;
                
                orbitalData.mesh.material.color.setRGB(
                    Math.min(r + musicTint + orbitalTint, 1),
                    Math.min(g + musicTint, 1),
                    Math.min(b + musicTint, 1)
                );
            } else {
                orbitalData.mesh.material.color.setHex(0x444444);
            }
        }
    }
    
    /**
     * Manage spawning of new orbital blobs
     */
    manageOrbitalSpawning() {
        const now = performance.now();
        
        // Check if we can spawn new orbital blobs
        if (this.orbitalBlobs.length < this.config.maxOrbitalBlobs &&
            now - this.lastSpawnTime > this.config.spawnCooldown) {
            
            // Spawn chance increases with music intensity
            const totalIntensity = this.visualizer.bassIntensity + 
                                 this.visualizer.midIntensity + 
                                 this.visualizer.highIntensity;
            
            const spawnChance = Math.min(totalIntensity * 0.8, 0.7);
            
            if (Math.random() < spawnChance || this.orbitalBlobs.length === 0) {
                this.spawnOrbitalBlob();
                this.lastSpawnTime = now;
            }
        }
    }
    
    /**
     * Remove an orbital blob
     */
    removeOrbitalBlob(index) {
        const orbitalData = this.orbitalBlobs[index];
        
        // Clean up Three.js objects
        this.scene.remove(orbitalData.mesh);
        this.scene.remove(orbitalData.innerCore);
        orbitalData.mesh.geometry.dispose();
        orbitalData.mesh.material.dispose();
        orbitalData.innerCore.geometry.dispose();
        orbitalData.innerCore.material.dispose();
        
        // Remove from array
        this.orbitalBlobs.splice(index, 1);
        
        console.log(`🌌 Orbital blob removed. Remaining: ${this.orbitalBlobs.length}`);
    }
    
    /**
     * Get orbital blob data for external access
     */
    getOrbitalBlobs() {
        return this.orbitalBlobs;
    }
    
    /**
     * Set system active state
     */
    setActive(active) {
        this.systemActive = active;
        console.log(`🌌 Orbital system ${active ? 'activated' : 'deactivated'}`);
    }
    
    /**
     * Clear all orbital blobs
     */
    clearAll() {
        while (this.orbitalBlobs.length > 0) {
            this.removeOrbitalBlob(0);
        }
    }
    
    /**
     * Update system configuration
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        console.log('🌌 Orbital system configuration updated');
    }
    
    /**
     * Get system statistics
     */
    getStats() {
        return {
            activeBlobs: this.orbitalBlobs.length,
            maxBlobs: this.config.maxOrbitalBlobs,
            systemActive: this.systemActive,
            patterns: this.orbitalBlobs.map(blob => blob.pattern)
        };
    }
    
    /**
     * Generate dynamic blob centers for sophisticated orbital blob deformation 
     * (adapted from main ferrofluid's system, scaled for orbital blobs)
     */
    generateOrbitalBlobCenters(time, orbitalData) {
        const blobCenters = [];
        const scaleToOrbital = orbitalData.baseSize / 3.0; // Scale relative to main ferrofluid
        
        // Get current audio intensities
        const bassIntensity = this.visualizer.bassIntensity;
        const midIntensity = this.visualizer.midIntensity;
        const highIntensity = this.visualizer.highIntensity;
        
        // === BASS DEFORMATIONS: Wide, shallow surface undulations ===
        if (bassIntensity > 0.15) {
            const numBassBlobs = Math.floor(1 + bassIntensity * 0.6);
            for (let i = 0; i < numBassBlobs; i++) {
                const randomAngleOffset1 = (Math.random() - 0.5) * 1.5;
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.0;
                const randomSpeedVariation = 0.8 + Math.random() * 0.4;
                
                const angle1 = time * 0.12 * randomSpeedVariation + i * Math.PI * 2 / numBassBlobs + randomAngleOffset1;
                const angle2 = Math.sin(time * 0.2 + i) * 0.4 + randomAngleOffset2;
                
                const position = new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * orbitalData.baseSize * 0.9,
                    Math.sin(angle2) * orbitalData.baseSize * 0.9,
                    Math.sin(angle1) * Math.cos(angle2) * orbitalData.baseSize * 0.9
                );
                
                const randomSizeFactor = 0.7 + Math.random() * 0.6;
                const randomStrengthFactor = 0.8 + Math.random() * 0.4;
                
                blobCenters.push({
                    position: position,
                    radius: (1.8 + bassIntensity * 1.0) * randomSizeFactor * scaleToOrbital,
                    intensity: Math.pow(bassIntensity, 1.0),
                    strength: (0.12 + bassIntensity * 0.2) * randomStrengthFactor,
                    type: 'bass'
                });
            }
        }
        
        // === MID PROTRUSIONS: Moderate height, medium width ===
        if (midIntensity > 0.06) {
            const numMidBlobs = Math.floor(1 + midIntensity * 2);
            for (let i = 0; i < numMidBlobs; i++) {
                const randomAngleOffset1 = (Math.random() - 0.5) * 2.0;
                const randomAngleOffset2 = (Math.random() - 0.5) * 1.5;
                const randomSpeedVariation = 0.7 + Math.random() * 0.6;
                
                const angle1 = time * 0.6 * randomSpeedVariation + i * Math.PI * 1.0 + randomAngleOffset1;
                const angle2 = Math.cos(time * 0.5 + i * 1.2) * 0.9 + randomAngleOffset2;
                
                const position = new THREE.Vector3(
                    Math.cos(angle1) * Math.cos(angle2) * orbitalData.baseSize * 0.85,
                    Math.sin(angle2) * orbitalData.baseSize * 0.85,
                    Math.sin(angle1) * Math.cos(angle2) * orbitalData.baseSize * 0.85
                );
                
                const randomSizeFactor = 0.7 + Math.random() * 0.6;
                const randomStrengthFactor = 0.8 + Math.random() * 0.4;
                
                blobCenters.push({
                    position: position,
                    radius: (0.6 + midIntensity * 0.4) * randomSizeFactor * scaleToOrbital,
                    intensity: Math.pow(midIntensity, 1.1),
                    strength: (1.8 + midIntensity * 2.0) * randomStrengthFactor,
                    type: 'mid'
                });
            }
        }
        
        // === HIGH SPIKES: Sharp, needle-like protrusions ===
        if (highIntensity > 0.02) {
            const numHighBlobs = Math.floor(4 + highIntensity * 12);
            for (let i = 0; i < numHighBlobs; i++) {
                // Uniform distribution across sphere surface
                const u = Math.random();
                const v = Math.random();
                
                const timeOffset = time * 2.2 + i * Math.PI * 0.3;
                const uAnimated = (u + Math.sin(timeOffset) * 0.08) % 1.0;
                const vAnimated = (v + Math.cos(timeOffset * 1.1) * 0.08) % 1.0;
                
                const theta = 2 * Math.PI * uAnimated;
                const phi = Math.acos(2 * vAnimated - 1);
                
                const position = new THREE.Vector3(
                    Math.sin(phi) * Math.cos(theta) * orbitalData.baseSize * 0.8,
                    Math.cos(phi) * orbitalData.baseSize * 0.8,
                    Math.sin(phi) * Math.sin(theta) * orbitalData.baseSize * 0.8
                );
                
                // Spike variety - different thickness types
                const spikeType = Math.random();
                let baseRadius, radiusVariation, strengthMultiplier;
                
                if (spikeType < 0.3) {
                    // Ultra-thin needles
                    baseRadius = 0.04 + highIntensity * 0.06;
                    radiusVariation = 0.4 + Math.random() * 0.3;
                    strengthMultiplier = 1.0 + Math.random() * 0.5;
                } else if (spikeType < 0.6) {
                    // Thin spikes
                    baseRadius = 0.08 + highIntensity * 0.1;
                    radiusVariation = 0.6 + Math.random() * 0.4;
                    strengthMultiplier = 0.8 + Math.random() * 0.4;
                } else {
                    // Medium spikes
                    baseRadius = 0.12 + highIntensity * 0.15;
                    radiusVariation = 0.5 + Math.random() * 0.6;
                    strengthMultiplier = 1.2 + Math.random() * 0.6;
                }
                
                const randomStrengthFactor = 0.7 + Math.random() * 0.6;
                
                blobCenters.push({
                    position: position,
                    radius: baseRadius * radiusVariation * scaleToOrbital,
                    intensity: Math.pow(highIntensity, 2.8),
                    strength: (2.5 + highIntensity * 3.0) * strengthMultiplier * randomStrengthFactor,
                    type: 'high'
                });
            }
        }
        
        return blobCenters;
    }

    // ...existing code...
}

// Export for use in main script
window.OrbitalBlobSystem = OrbitalBlobSystem;
