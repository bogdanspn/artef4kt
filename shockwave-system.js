class ShockwaveSystem {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.shockwaves = [];
        this.maxShockwaves = 8;
        this.enabled = false; // Disable shockwave system by default        // Shockwave configuration - simplified with fixed values
        this.config = {
            ringsPerShockwave: 3,   // Fixed number of rings per shockwave
            expansionSpeed: 3.0,    // Fixed expansion speed for predictable behavior
            lifetime: 3.0,          // How long shockwaves last (seconds) - configurable
            intensity: 1.0,         // Overall intensity multiplier - configurable
            opacity: 0.8,           // Line opacity - configurable
            color: 0xffffff,        // Default color
            ondulationSpeed: 4.0,   // Speed of wave ondulation
            ondulationAmount: 0.3,  // Amount of ondulation (0-1)            harmonicCount: 3       // Number of harmonic frequencies
        };
        
        // Beat detection state
        this.lastBeatTime = 0;
        this.beatCooldown = 150; // Minimum ms between beat-triggered shockwaves
        
        this.setupMaterials();
    }    setupMaterials() {
        // Create smooth line materials for different frequencies with enhanced smoothness
        // Enable depth testing so lines don't show through the main blob
        // Add antialiasing for smoother line appearance
        this.materials = {
            bass: new THREE.LineBasicMaterial({ 
                color: 0xff3366, 
                transparent: true, 
                opacity: this.config.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                linewidth: 1, // Kept minimal for compatibility
                vertexColors: false,
                fog: false
            }),
            mid: new THREE.LineBasicMaterial({ 
                color: 0x33ff66, 
                transparent: true, 
                opacity: this.config.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                linewidth: 1,
                vertexColors: false,
                fog: false
            }),
            high: new THREE.LineBasicMaterial({ 
                color: 0x3366ff, 
                transparent: true, 
                opacity: this.config.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                linewidth: 1,
                vertexColors: false,
                fog: false
            }),
            mixed: new THREE.LineBasicMaterial({ 
                color: this.config.color, 
                transparent: true, 
                opacity: this.config.opacity,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true,
                linewidth: 1,
                vertexColors: false,
                fog: false
            })
        };
    }
      update(deltaTime) {
        // Skip update if shockwave system is disabled
        if (!this.enabled) return;
        
        // Check for beat detection and trigger shockwaves
        this.checkForBeats();
        
        // Update existing shockwaves
        this.updateShockwaves(deltaTime);
        
        // Clean up expired shockwaves
        this.cleanupShockwaves();
    }
    
    checkForBeats() {
        const now = performance.now();
        const bpmDetector = this.visualizer.bpmDetector;
        
        // Check if a beat was detected recently and we're not in cooldown
        if (bpmDetector.lastBeatTime > this.lastBeatTime && 
            now - this.lastBeatTime > this.beatCooldown) {
            
            // Determine shockwave type based on frequency intensities
            const bassIntensity = this.visualizer.bassIntensity;
            const midIntensity = this.visualizer.midIntensity;
            const highIntensity = this.visualizer.highIntensity;
            const totalIntensity = bassIntensity + midIntensity + highIntensity;
            
            if (totalIntensity > 0.15) { // Only create shockwave if there's significant audio
                this.createShockwave(bassIntensity, midIntensity, highIntensity);
                this.lastBeatTime = bpmDetector.lastBeatTime;
            }
        }
    }
    
    createShockwave(bassIntensity, midIntensity, highIntensity) {
        // Remove oldest shockwave if we're at capacity
        if (this.shockwaves.length >= this.maxShockwaves) {
            this.removeShockwave(0);
        }
        
        // Determine dominant frequency and shockwave characteristics
        const frequencies = [
            { type: 'bass', intensity: bassIntensity },
            { type: 'mid', intensity: midIntensity },
            { type: 'high', intensity: highIntensity }
        ];
        
        const dominantFreq = frequencies.reduce((a, b) => 
            a.intensity > b.intensity ? a : b
        );
          const totalIntensity = bassIntensity + midIntensity + highIntensity;        // Create shockwave based on dominant frequency
        // Calculate the longest ring lifetime to ensure shockwave doesn't expire before its rings
        const longestRingLifetime = this.config.lifetime + ((this.config.ringsPerShockwave - 1) * 0.8);
          const shockwave = {
            id: Date.now() + Math.random(),
            type: dominantFreq.type,
            life: 1.0,
            maxLife: longestRingLifetime, // Use longest ring lifetime instead of base lifetime
            radius: 3.2, // Start from just outside the main blob surface (blob radius = 3.0)
            intensity: totalIntensity,
            lines: [],
            position: this.visualizer.ferrofluid.position.clone(),
            createdAt: performance.now()
            // Removed speed storage - always use current config.expansionSpeed
        };
        
        // Generate initial line directions
        this.generateShockwaveLines(shockwave, dominantFreq.type, totalIntensity);
        
        this.shockwaves.push(shockwave);
    }    generateShockwaveLines(shockwave, type, intensity) {
        // Use fixed number of rings for consistency
        const ringCount = this.config.ringsPerShockwave;
        
        // Generate concentric rings with ordered spacing
        for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
            // Ordered spacing between rings
            const ringOffset = ringIndex * 0.8; // Fixed spacing              // Balanced point counts for performance while maintaining smoothness
            let pointsPerRing;
            switch(type) {
                case 'bass':
                    pointsPerRing = 64; // Good balance for bass frequencies
                    break;
                case 'mid':
                    pointsPerRing = 80; // Slightly higher for mid detail
                    break;
                case 'high':
                    pointsPerRing = 96; // Higher detail for crisp high frequencies
                    break;
            }              const ring = {
                id: ringIndex,
                pointsPerRing: pointsPerRing,
                offset: ringOffset,
                points: [],
                originalPoints: [],
                geometry: null,
                mesh: null,
                phase: ringIndex * Math.PI * 0.3, // Ordered phase offset
                frequencyType: type,
                harmonics: this.generateOrderedHarmonics(ringIndex),
                // Individual lifetime for staggered fade-out
                life: 1.0,
                maxLife: this.config.lifetime + (ringIndex * 0.8), // Each ring lives 0.8s longer than the previous
                startTime: performance.now(),
                rotationOffset: Math.random() * Math.PI * 2 // Random rotation to vary seam position
            };

            this.createRingGeometry(ring, shockwave);
            shockwave.lines.push(ring);
        }
    }

    generateOrderedHarmonics(ringIndex) {
        // Generate more ordered harmonic frequencies for cleaner ondulation
        const harmonics = [];
        const baseFrequencies = [1.0, 1.5, 2.0]; // More ordered base frequencies
        
        for (let i = 0; i < this.config.harmonicCount; i++) {
            harmonics.push({
                frequency: baseFrequencies[i % baseFrequencies.length] + ringIndex * 0.1, // Slight variation per ring
                amplitude: 0.2 + Math.sin(ringIndex * 0.5) * 0.3, // Ordered amplitude variation
                phase: i * Math.PI * 0.67 + ringIndex * 0.2 // Golden ratio phase spacing
            });
        }
        return harmonics;
    }    createRingGeometry(ring, shockwave) {
        // Create circular ring points with smooth ondulation
        const points = [];
        const originalPoints = [];
          // Create points for a complete circle (excluding the duplicate end point)
        for (let i = 0; i < ring.pointsPerRing; i++) {
            const angle = (i / ring.pointsPerRing) * Math.PI * 2 + ring.rotationOffset;
            
            // Create point on circle (starting small, will expand with shockwave)
            const x = Math.cos(angle);
            const z = Math.sin(angle);
            const y = 0; // Start flat
            
            const point = new THREE.Vector3(x, y, z);
            const originalPoint = point.clone();
            
            points.push(point);
            originalPoints.push(originalPoint);
        }
        
        ring.points = points;
        ring.originalPoints = originalPoints;
          // Create Three.js geometry
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // Each ring needs its own material instance to avoid opacity conflicts
        const baseMaterial = this.materials[shockwave.type] || this.materials.mixed;
        const material = baseMaterial.clone(); // Clone the material for independent opacity control
        
        ring.geometry = geometry;
        ring.material = material; // Store reference for cleanup
        // Use LineLoop instead of Line to automatically close the ring
        ring.mesh = new THREE.LineLoop(geometry, material);
        
        // Add to scene
        this.visualizer.scene.add(ring.mesh);
    }    updateShockwaves(deltaTime) {
        for (const shockwave of this.shockwaves) {
            // Update lifetime (simple countdown from 1.0 to 0.0)
            shockwave.life -= deltaTime / shockwave.maxLife;
            
            // Update expansion using fixed speed for consistent behavior
            shockwave.radius += this.config.expansionSpeed * deltaTime;            // Update each ring's individual lifetime for staggered fade-out
            for (const ring of shockwave.lines) {
                ring.life -= deltaTime / ring.maxLife;
            }
            
            // Update each line in the shockwave
            this.updateShockwaveLines(shockwave, deltaTime);
            
            // Apply enhanced lifetime-based fade to all rings
            this.applySimpleFade(shockwave);
        }
    }updateShockwaveLines(shockwave, deltaTime) {
        const currentTime = performance.now() * 0.001; // Convert to seconds
        
        // Get current audio intensities for music-responsive ondulation
        const bassIntensity = this.visualizer.bassIntensity || 0;
        const midIntensity = this.visualizer.midIntensity || 0;
        const highIntensity = this.visualizer.highIntensity || 0;
        
        for (const ring of shockwave.lines) {
            // Update ring geometry with music-responsive ondulation
            this.updateRingGeometryWithOndulation(ring, shockwave, currentTime, {
                bass: bassIntensity,
                mid: midIntensity,
                high: highIntensity
            });
        }
    }      updateRingGeometryWithOndulation(ring, shockwave, currentTime, audioIntensities) {
        // Calculate current ring radius including offset
        const currentRadius = shockwave.radius + ring.offset;
        const ondulatedPoints = [];
        
        // Get intensity for this ring's frequency type
        const typeIntensity = audioIntensities[ring.frequencyType] || 0;          // Create smooth ondulated points with enhanced irregularities controlled by intensity
        for (let i = 0; i < ring.originalPoints.length; i++) {
            // Start with original point on unit circle
            const originalPoint = ring.originalPoints[i].clone();
            const angle = (i / ring.pointsPerRing) * Math.PI * 2;            // Base irregularity influenced by intensity setting (minimal effect)
            const intensityFactor = this.config.intensity * 0.3; // Greatly reduced overall intensity impact
            
            // Enhanced organic ondulation with very subtle intensity control
            let ondulation = 0;
            
            // Primary organic wave with minimal intensity-controlled variation
            const primaryFreq = 2.0 + Math.sin(currentTime * 0.4 + ring.phase) * 0.2 * intensityFactor; // Reduced from 0.4
            const primaryWave = Math.sin(angle * primaryFreq + currentTime * 1.2 + ring.phase);
            ondulation += primaryWave * (0.4 + intensityFactor * 0.05); // Greatly reduced from 0.15
            
            // Secondary irregular wave for organic complexity
            const secondaryFreq = 3.5 + Math.cos(currentTime * 0.3 + angle * 0.1) * 0.3 * intensityFactor; // Reduced from 0.6
            const secondaryWave = Math.sin(angle * secondaryFreq + currentTime * 0.8 + ring.phase * 1.4);
            ondulation += secondaryWave * (0.25 + intensityFactor * 0.03); // Greatly reduced from 0.1
            
            // Tertiary wave for more natural irregularities
            const tertiaryFreq = 1.5 + Math.sin(angle * 0.3 + currentTime * 0.2) * 0.15 * intensityFactor; // Reduced from 0.3
            const tertiaryWave = Math.cos(angle * tertiaryFreq + currentTime * 1.8 + ring.phase * 0.7);
            ondulation += tertiaryWave * (0.15 + intensityFactor * 0.02); // Greatly reduced from 0.08
            
            // Music responsiveness with minimal intensity effect
            if (typeIntensity > 0) {
                const musicFreq = 2.5 + typeIntensity * 0.8 * intensityFactor; // Reduced from 1.2
                const musicWave = Math.sin(angle * musicFreq + currentTime * 2.5 + ring.phase * 0.3);
                ondulation += musicWave * typeIntensity * (0.3 + intensityFactor * 0.05); // Greatly reduced from 0.2
                
                // Add chaotic element for organic feel when music is active
                const chaoticWave = Math.sin(angle * (4.0 + typeIntensity * 3.0) + currentTime * 3.0);
                ondulation += chaoticWave * typeIntensity * intensityFactor * 0.03; // Greatly reduced from 0.1
            }
            
            // Breathing effect with organic variation
            const totalEnergy = audioIntensities.bass + audioIntensities.mid + audioIntensities.high;
            const breathingWave = Math.sin(currentTime * 0.6 + ring.phase * 0.8 + angle * 0.2); // Add angle variation
            ondulation += breathingWave * totalEnergy * (0.15 + intensityFactor * 0.01); // Greatly reduced from 0.05
            
            // Apply ondulation with very subtle intensity-controlled scaling
            const ondulationAmount = this.config.ondulationAmount * (0.8 + intensityFactor * 0.1) * shockwave.life; // Greatly reduced from 0.4
            const finalRadius = currentRadius * (1.0 + ondulation * ondulationAmount);
            
            // Enhanced radius variation with minimal intensity effect
            const organicVariation = Math.sin(angle * 2.3 + currentTime * 0.5) * Math.cos(angle * 1.7 + currentTime * 0.3);
            const radiusVariation = 1.0 + organicVariation * (0.008 + intensityFactor * 0.002); // Greatly reduced from 0.006
            let scaledPoint = originalPoint.multiplyScalar(finalRadius * radiusVariation);
            
            // Enhanced vertical movement with minimal intensity effect
            const verticalWave1 = Math.sin(angle * 2.8 + currentTime * 1.3 + ring.phase);
            const verticalWave2 = Math.cos(angle * 1.6 + currentTime * 0.9 + ring.phase * 0.5);
            const verticalComplex = (verticalWave1 + verticalWave2 * 0.6) * (0.5 + intensityFactor * 0.1); // Greatly reduced from 0.3
            scaledPoint.y = verticalComplex * (typeIntensity + 0.2) * currentRadius * (0.04 + intensityFactor * 0.005); // Greatly reduced from 0.02
            
            // Position relative to shockwave center
            const worldPoint = shockwave.position.clone().add(scaledPoint);
            ondulatedPoints.push(worldPoint);
        }// Apply additional smoothing to eliminate polygonal artifacts
        const smoothedPoints = this.applyCurveSmoothing(ondulatedPoints);
        
        // Update Three.js geometry with smoothed points (LineLoop will auto-close)
        if (ring.geometry && smoothedPoints.length > 2) {
            ring.geometry.setFromPoints(smoothedPoints);
            ring.geometry.attributes.position.needsUpdate = true;
        }
    }
      // Create smooth Catmull-Rom spline curve through ring points
    createSmoothRingCurve(points, originalPointCount) {
        if (points.length < 3) return points;
        
        // Ensure we have enough points for smooth interpolation
        let processedPoints = [...points];
        
        // Add extra points at beginning and end for better closed curve interpolation
        processedPoints.push(points[0].clone()); // Close the curve properly
        processedPoints.unshift(points[points.length - 1].clone()); // Add point at beginning
        
        try {
            // Create Catmull-Rom curve for smooth interpolation
            const curve = new THREE.CatmullRomCurve3(processedPoints, true, 'centripetal', 0.1);
            
            // Generate smooth points with appropriate density
            const smoothPointCount = Math.max(originalPointCount * 1.5, 64);
            const smoothPoints = curve.getPoints(smoothPointCount);
            
            return smoothPoints;
        } catch (error) {
            console.warn('Error creating smooth curve, using original points:', error);
            return points;
        }
    }
    
    // Smooth step function for natural deflection transitions
    smoothStep(t) {
        return t * t * (3.0 - 2.0 * t);
    }    // Enhanced fade system with individual ring lifetimes for staggered fade-out
    applySimpleFade(shockwave) {
        // Each ring has its own lifetime, so they fade out individually
        for (const ring of shockwave.lines) {
            if (ring.mesh && ring.mesh.material) {
                // Calculate opacity based on this ring's individual life ratio
                const lifeRatio = Math.max(0, Math.min(1, ring.life));
                
                // Smooth continuous fade that starts earlier for better visual flow
                // No hard transitions - just a smooth curve from full to zero opacity
                let fadeMultiplier;
                
                if (lifeRatio > 0.7) {
                    // Keep full opacity until 70% life remaining  
                    fadeMultiplier = 1.0;
                } else {
                    // Smooth exponential fade from 70% to 0% life
                    // Using a gentler power curve for very smooth transition
                    const fadeProgress = lifeRatio / 0.7; // Normalize 0.7->0 to 1->0
                    fadeMultiplier = Math.pow(fadeProgress, 0.8); // Gentler curve
                }
                
                const finalOpacityValue = this.config.opacity * fadeMultiplier;
                ring.mesh.material.opacity = finalOpacityValue;
            }
        }
    }
    
    updateLineGeometry(line, shockwave) {
        // Calculate new line points with bending
        const points = [];
        const segmentLength = line.length / this.config.segments;
        const currentLength = Math.min(line.length, shockwave.radius);
        
        for (let i = 0; i <= this.config.segments; i++) {
            const t = i / this.config.segments;
            const segmentDistance = t * currentLength;
            
            // Create curved line based on deflection
            let direction = line.originalDirection.clone();
            
            if (line.deflectionAmount > 0) {
                // Interpolate between original and deflected direction based on position along line
                const deflectionStrength = Math.sin(t * Math.PI) * line.deflectionAmount;
                direction.lerp(line.direction, deflectionStrength);
            }
            
            const point = shockwave.position.clone()
                .add(direction.multiplyScalar(segmentDistance));
            
            points.push(point);
        }
        
        // Update geometry
        if (line.geometry && points.length > 1) {
            line.geometry.setFromPoints(points);
            line.geometry.attributes.position.needsUpdate = true;
        }
    }    cleanupShockwaves() {
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const shockwave = this.shockwaves[i];
            
            // Remove expired rings within the shockwave
            for (let j = shockwave.lines.length - 1; j >= 0; j--) {
                const ring = shockwave.lines[j];                // Only remove rings when their life has completely expired
                // Opacity-based removal is redundant since rings fade to 0 before life expires
                if (ring.life <= 0) {
                    // Remove this specific ring from the scene and dispose of resources
                    if (ring.mesh) {
                        this.visualizer.scene.remove(ring.mesh);
                        if (ring.geometry) ring.geometry.dispose();
                        if (ring.material) ring.material.dispose(); // Dispose cloned material
                    }
                    shockwave.lines.splice(j, 1);
                }
            }
            
            // Only remove the shockwave when all its rings have been removed naturally
            // The shockwave's lifetime now matches the longest ring, so this should be rare
            if (shockwave.lines.length === 0) {
                this.removeShockwave(i);
            }
        }
    }
      removeShockwave(index) {
        const shockwave = this.shockwaves[index];
        
        // Remove all line meshes from scene and dispose of resources
        for (const line of shockwave.lines) {
            if (line.mesh) {
                this.visualizer.scene.remove(line.mesh);
                if (line.geometry) line.geometry.dispose();
                if (line.material) line.material.dispose(); // Dispose cloned material
            }
        }
        
        this.shockwaves.splice(index, 1);
    }
    
    // Configuration methods
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.setupMaterials(); // Update materials if colors changed
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Clear all existing shockwaves
            while (this.shockwaves.length > 0) {
                this.removeShockwave(0);
            }
        }
    }    // Manual trigger for testing
    triggerShockwave(intensity = 0.5) {
        this.createShockwave(intensity * 0.7, intensity * 0.8, intensity * 0.6);
    }
    
    // Get statistics
    getStats() {
        return {
            activeShockwaves: this.shockwaves.length,
            totalLines: this.shockwaves.reduce((sum, sw) => sum + sw.lines.length, 0),
            lastBeatTime: this.lastBeatTime
        };
    }
    
    // Cleanup method
    destroy() {
        while (this.shockwaves.length > 0) {
            this.removeShockwave(0);
        }
        
        // Dispose materials
        Object.values(this.materials).forEach(material => material.dispose());
    }
    
    // Helper functions for smooth ondulation calculations
    smoothClamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    getAverageFrequency(freqData, startIndex, endIndex) {
        let sum = 0;
        let count = 0;
        for (let i = startIndex; i < Math.min(endIndex, freqData.length); i++) {
            sum += freqData[i];
            count++;
        }
        return count > 0 ? sum / count : 0;
    }
      // UI Configuration update methods - simplified for fixed values
    updateFromUI() {
        // Get current UI values and update only configurable settings
        const shockwaveEnabled = document.getElementById('shockwave-enabled')?.checked ?? false;
        const intensity = parseFloat(document.getElementById('shockwave-intensity')?.value ?? this.config.intensity);
        const lifetime = parseFloat(document.getElementById('shockwave-lifetime')?.value ?? this.config.lifetime);
        const opacity = parseFloat(document.getElementById('shockwave-opacity')?.value ?? this.config.opacity);
        
        // Update only configurable settings (expansion speed and ring count are now fixed)
        this.config.intensity = intensity;
        this.config.lifetime = lifetime;
        this.config.opacity = opacity;
        
        // Update material opacities
        Object.values(this.materials).forEach(material => {
            material.opacity = opacity;
        });
        
        // Enable/disable system
        this.setEnabled(shockwaveEnabled);
        
        console.log('Shockwave configuration updated from UI (simplified):', {
            enabled: shockwaveEnabled,
            intensity: this.config.intensity,
            lifetime: this.config.lifetime,
            opacity: this.config.opacity,
            ringsPerShockwave: this.config.ringsPerShockwave,
            expansionSpeed: this.config.expansionSpeed
        });
    }    // Apply light curve smoothing to maintain organic irregularities
    applyCurveSmoothing(points) {
        if (points.length < 4) return points;
        
        const smoothedPoints = [];
        
        // Light smoothing - only add interpolated points, don't over-smooth the organic variations
        for (let i = 0; i < points.length; i++) {
            // Add the current point (preserve original irregularities)
            smoothedPoints.push(points[i].clone());
            
            // Only add interpolated points occasionally to maintain organic feel
            if (i < points.length - 1 && i % 2 === 0) { // Every other point
                const p0 = points[i === 0 ? points.length - 1 : i - 1];
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                const p3 = points[(i + 2) % points.length];
                
                const t = 0.5; // Light interpolation
                const interpolated = this.catmullRomInterpolate(p0, p1, p2, p3, t);
                smoothedPoints.push(interpolated);
            }
        }
        
        return smoothedPoints;
    }

    // Catmull-Rom spline interpolation for smooth curves
    catmullRomInterpolate(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        
        // Catmull-Rom coefficients
        const v0 = (p2.x - p0.x) * 0.5;
        const v1 = (p3.x - p1.x) * 0.5;
        const a = 2 * p1.x - 2 * p2.x + v0 + v1;
        const b = -3 * p1.x + 3 * p2.x - 2 * v0 - v1;
        const c = v0;
        const d = p1.x;
        const x = a * t3 + b * t2 + c * t + d;
        
        const v0y = (p2.y - p0.y) * 0.5;
        const v1y = (p3.y - p1.y) * 0.5;
        const ay = 2 * p1.y - 2 * p2.y + v0y + v1y;
        const by = -3 * p1.y + 3 * p2.y - 2 * v0y - v1y;
        const cy = v0y;
        const dy = p1.y;
        const y = ay * t3 + by * t2 + cy * t + dy;
        
        const v0z = (p2.z - p0.z) * 0.5;
        const v1z = (p3.z - p1.z) * 0.5;
        const az = 2 * p1.z - 2 * p2.z + v0z + v1z;
        const bz = -3 * p1.z + 3 * p2.z - 2 * v0z - v1z;
        const cz = v0z;
        const dz = p1.z;
        const z = az * t3 + bz * t2 + cz * t + dz;
        
        return new THREE.Vector3(x, y, z);
    }
}
