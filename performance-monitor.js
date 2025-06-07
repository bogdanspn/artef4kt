// Performance Monitor System for Ferrofluid Visualizer
// Tracks performance metrics and automatically adjusts quality to maintain smooth performance

class PerformanceMonitor {
    constructor(visualizer) {
        this.visualizer = visualizer;
        
        // Performance tracking
        this.frameRates = [];
        this.frameRateWindow = 60; // Track last 60 frames
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        
        // Performance targets
        this.targetFPS = 60;
        this.minAcceptableFPS = 45;
        this.performanceCheckInterval = 2000; // Check every 2 seconds
        this.lastPerformanceCheck = performance.now();
        
        // Quality scaling settings
        this.qualityLevels = {
            high: {
                maxFloatingBlobs: 50,
                maxOrbitalBlobs: 4,
                maxGridCells: 35,
                vertexDamping: 0.15,
                geometryDetail: { widthSegments: 128, heightSegments: 128 },
                updateFrequency: 1.0
            },
            medium: {
                maxFloatingBlobs: 35,
                maxOrbitalBlobs: 3,
                maxGridCells: 25,
                vertexDamping: 0.18,
                geometryDetail: { widthSegments: 96, heightSegments: 96 },
                updateFrequency: 0.8
            },
            low: {
                maxFloatingBlobs: 20,
                maxOrbitalBlobs: 2,
                maxGridCells: 15,
                vertexDamping: 0.22,
                geometryDetail: { widthSegments: 64, heightSegments: 64 },
                updateFrequency: 0.6
            }
        };
        
        this.currentQualityLevel = 'high';
        this.qualityAdjustmentCooldown = 5000; // 5 seconds between adjustments
        this.lastQualityAdjustment = 0;
        
        // Memory tracking
        this.memoryUsage = {
            geometries: 0,
            materials: 0,
            textures: 0,
            objects: 0
        };
        
        console.log('🎛️ Performance Monitor initialized');
    }
    
    // Called every frame to track performance
    update() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Calculate FPS
        const fps = 1000 / deltaTime;
        this.frameRates.push(fps);
        
        // Keep only recent frame rates
        if (this.frameRates.length > this.frameRateWindow) {
            this.frameRates.shift();
        }
        
        this.frameCount++;
        
        // Periodic performance check
        if (now - this.lastPerformanceCheck > this.performanceCheckInterval) {
            this.performPerformanceCheck();
            this.lastPerformanceCheck = now;
        }
    }
    
    // Analyze current performance and adjust quality if needed
    performPerformanceCheck() {
        if (this.frameRates.length < 30) return; // Need enough samples
        
        const avgFPS = this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length;
        const minFPS = Math.min(...this.frameRates);
        
        const now = performance.now();
        
        // Performance degradation detected
        if (avgFPS < this.minAcceptableFPS || minFPS < 30) {
            if (now - this.lastQualityAdjustment > this.qualityAdjustmentCooldown) {
                this.decreaseQuality();
                this.lastQualityAdjustment = now;
            }
        }
        // Performance is good, maybe we can increase quality
        else if (avgFPS > this.targetFPS && minFPS > 50) {
            if (now - this.lastQualityAdjustment > this.qualityAdjustmentCooldown * 2) {
                this.increaseQuality();
                this.lastQualityAdjustment = now;
            }
        }        // Update performance stats display (handled by main script)
    }
    
    // Decrease quality level to improve performance
    decreaseQuality() {
        const levels = ['high', 'medium', 'low'];
        const currentIndex = levels.indexOf(this.currentQualityLevel);
        
        if (currentIndex < levels.length - 1) {
            this.currentQualityLevel = levels[currentIndex + 1];
            this.applyQualitySettings();
            console.log(`🎛️ Quality decreased to: ${this.currentQualityLevel}`);
        }
    }
    
    // Increase quality level when performance allows
    increaseQuality() {
        const levels = ['high', 'medium', 'low'];
        const currentIndex = levels.indexOf(this.currentQualityLevel);
        
        if (currentIndex > 0) {
            this.currentQualityLevel = levels[currentIndex - 1];
            this.applyQualitySettings();
            console.log(`🎛️ Quality increased to: ${this.currentQualityLevel}`);
        }
    }
    
    // Apply current quality settings to the visualizer
    applyQualitySettings() {
        const settings = this.qualityLevels[this.currentQualityLevel];
        
        // Adjust floating blob limits
        if (this.visualizer.maxFloatingBlobs !== settings.maxFloatingBlobs) {
            this.visualizer.maxFloatingBlobs = settings.maxFloatingBlobs;
            this.enforceObjectLimits();
        }
        
        // Adjust orbital blob limits
        if (this.visualizer.orbitalBlobSystem) {
            this.visualizer.orbitalBlobSystem.config.maxOrbitalBlobs = settings.maxOrbitalBlobs;
        }
        
        // Adjust grid cell limits
        if (this.visualizer.gridCellAnimator) {
            this.visualizer.gridCellAnimator.maxActiveCells = settings.maxGridCells;
        }
        
        // Adjust vertex update damping for smoother performance
        this.visualizer.performanceDamping = settings.vertexDamping;
        
        // Schedule geometry detail update if needed (for future use)
        this.scheduleGeometryUpdate = settings.geometryDetail;
    }
      // Remove excess objects to stay within performance limits
    enforceObjectLimits() {
        const settings = this.qualityLevels[this.currentQualityLevel];
        
        // Remove excess floating blobs
        if (this.visualizer.floatingBlobs && this.visualizer.floatingBlobs.length > settings.maxFloatingBlobs) {
            while (this.visualizer.floatingBlobs.length > settings.maxFloatingBlobs) {
                const blobData = this.visualizer.floatingBlobs.pop();
                this.cleanupBlob(blobData);
            }
        }
        
        // Remove excess orbital blobs
        if (this.visualizer.orbitalBlobSystem && this.visualizer.orbitalBlobSystem.orbitalBlobs) {
            while (this.visualizer.orbitalBlobSystem.orbitalBlobs.length > settings.maxOrbitalBlobs) {
                this.visualizer.orbitalBlobSystem.removeOrbitalBlob(
                    this.visualizer.orbitalBlobSystem.orbitalBlobs.length - 1
                );
            }
        }
        
        // Remove excess grid cells (check if gridCellAnimator exists and has activeCells)
        if (this.visualizer.gridCellAnimator && this.visualizer.gridCellAnimator.activeCells) {
            while (this.visualizer.gridCellAnimator.activeCells.length > settings.maxGridCells) {
                const cell = this.visualizer.gridCellAnimator.activeCells.pop();
                this.cleanupGridCell(cell);
            }
        }
    }
    
    // Clean up a floating blob properly
    cleanupBlob(blobData) {
        if (blobData.mesh) {
            this.visualizer.scene.remove(blobData.mesh);
            blobData.mesh.geometry.dispose();
            blobData.mesh.material.dispose();
        }
        
        if (blobData.innerCore) {
            this.visualizer.scene.remove(blobData.innerCore);
            blobData.innerCore.geometry.dispose();
            blobData.innerCore.material.dispose();
        }
    }
    
    // Clean up a grid cell properly
    cleanupGridCell(cell) {
        if (cell.wireframeMesh) {
            this.visualizer.scene.remove(cell.wireframeMesh);
            cell.wireframeMesh.geometry.dispose();
            cell.wireframeMesh.material.dispose();
        }
        
        if (cell.fillMesh) {
            this.visualizer.scene.remove(cell.fillMesh);
            cell.fillMesh.geometry.dispose();
            cell.fillMesh.material.dispose();
        }
        
        // Clean up position tracking
        if (cell.positionKey && this.visualizer.gridCellAnimator.occupiedPositions) {
            this.visualizer.gridCellAnimator.occupiedPositions.delete(cell.positionKey);
        }
    }
      
    // Get current performance stats
    getStats() {
        const avgFPS = this.frameRates.length > 0 ? 
            this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length : 0;
        
        return {
            avgFPS: avgFPS,
            minFPS: this.frameRates.length > 0 ? Math.min(...this.frameRates) : 0,
            frameCount: this.frameCount,
            currentQuality: this.currentQualityLevel,
            objectCounts: {
                floatingBlobs: this.visualizer.floatingBlobs?.length || 0,
                orbitalBlobs: this.visualizer.orbitalBlobSystem?.orbitalBlobs?.length || 0,
                gridCells: this.visualizer.gridCellAnimator?.activeCells?.length || 0,
                shockwaves: this.visualizer.shockwaveSystem?.shockwaves?.length || 0
            }
        };
    }
    
    // Force a specific quality level
    setQualityLevel(level) {
        if (this.qualityLevels[level]) {
            this.currentQualityLevel = level;
            this.applyQualitySettings();
            console.log(`🎛️ Quality manually set to: ${level}`);
        }
    }
    
    // Enable/disable performance monitoring
    setEnabled(enabled) {
        this.enabled = enabled;
        const indicator = document.getElementById('performance-indicator');
        if (indicator) {
            indicator.style.display = enabled ? 'block' : 'none';
        }
    }
}

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
