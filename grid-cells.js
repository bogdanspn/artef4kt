// This is a test to check if we can animate grid cells to the music

class GridCellAnimator {
    constructor(gridSize, scene, audioAnalyzer, gridColor = 0xffffff, backgroundColor = 0x000000) {
        this.gridSize = gridSize;
        this.scene = scene;
        this.audioAnalyzer = audioAnalyzer;
        this.gridColor = gridColor;
        this.backgroundColor = backgroundColor;
        this.activeCells = [];
        this.occupiedPositions = new Set(); // Track occupied grid positions to prevent overlaps
        this.maxActiveCells = 35; // More active cells
        this.cellLifespan = 1.2; // in seconds (longer for growth animation)
        this.nextSpawnTime = 0;
        this.spawnCooldown = 0.08; // minimum time between spawns
        this.minCellHeight = 0.1; // Minimum cell height when just appearing
        this.maxCellHeight = 0.1; // Maximum cell height for strong beats
        
        // Create base wireframe material (for edges only)
        this.wireframeMaterial = new THREE.MeshBasicMaterial({
            color: this.gridColor,
            transparent: true,
            opacity: 0.9,
            wireframe: true
        });
    }    update(time, deltaTime, bassIntensity, midIntensity, highIntensity, gridVisible = true, gridOpacity = 0.3) {
        // Update existing cells
        for (let i = this.activeCells.length - 1; i >= 0; i--) {
            const cell = this.activeCells[i];
            
            // Update lifespan
            cell.life -= deltaTime;
            
            // Update position and scale based on life
            const lifeProgress = 1.0 - (cell.life / cell.maxLife);
            
            // Growth animation - cells grow out of grid then shrink back down
            let heightScale;
            if (lifeProgress < 0.15) {
                // Growth phase - much faster
                heightScale = this.easeOut(lifeProgress / 0.15) * cell.targetHeight;
            } else if (lifeProgress < 0.4) {
                // Hold phase - maintain full height
                heightScale = cell.targetHeight;
            } else {
                // Shrink phase - ease in for smooth deceleration
                const shrinkProgress = (lifeProgress - 0.4) / 0.6;
                heightScale = cell.targetHeight * (1 - this.easeIn(shrinkProgress));
            }            // Apply scaling and positioning based on wall orientation - one face flush with grid surface
            if (cell.wall === 'floor') {
                // Classic 3D bar: base fixed at grid cell, grows upward
                cell.wireframeMesh.scale.y = Math.max(0.01, heightScale);
                cell.wireframeMesh.position.x = cell.basePosition.x;
                cell.wireframeMesh.position.z = cell.basePosition.z;
                // Base always fixed at floor (y = -10), only height changes
                cell.wireframeMesh.position.y = -10;
            } else {
                // Hide or skip all other walls for classic bar visualizer effect
                cell.wireframeMesh.visible = false;
            }
              // Opacity animation that respects grid settings
            let opacity = 1.0;
            if (lifeProgress < 0.1) {
                opacity = lifeProgress / 0.1; // Fade in
            } else if (lifeProgress > 0.9) {
                opacity = (1 - lifeProgress) / 0.1; // Fade out
            }
            
            // Apply grid visibility and opacity settings
            const isVisible = gridVisible;
            const finalWireframeOpacity = isVisible ? opacity * 0.9 * (gridOpacity * 2.5) : 0;
            
            cell.wireframeMesh.material.opacity = finalWireframeOpacity;
            cell.wireframeMesh.visible = isVisible;
              // Remove expired cells
            if (cell.life <= 0) {
                this.scene.remove(cell.wireframeMesh);
                cell.wireframeMesh.geometry.dispose();
                cell.wireframeMesh.material.dispose();
                
                // Clean up occupied position
                if (cell.positionKey) {
                    this.occupiedPositions.delete(cell.positionKey);
                }
                
                this.activeCells.splice(i, 1);
            }
        }
          // Only spawn new cells if grid is visible
        if (gridVisible) {
            const totalIntensity = bassIntensity + midIntensity + highIntensity;
            
            if (time >= this.nextSpawnTime && totalIntensity > 0.12) {
                const spawnChance = Math.min(totalIntensity * 1.8, 0.9);
                
                if (Math.random() < spawnChance && this.activeCells.length < this.maxActiveCells) {
                    this.spawnRandomCell(bassIntensity, midIntensity, highIntensity);
                    
                    // Dynamic cooldown based on intensity
                    this.nextSpawnTime = time + this.spawnCooldown * (1 - totalIntensity * 0.6);
                }
            }
        }
    }    spawnRandomCell(bassIntensity, midIntensity, highIntensity) {
        const wallOptions = ['floor', 'back', 'left', 'right', 'front'];
        let attempts = 0;
        let selectedWall, gridX, gridZ, positionKey;
        do {
            selectedWall = wallOptions[Math.floor(Math.random() * wallOptions.length)];
            gridX = Math.floor(Math.random() * this.gridSize);
            gridZ = Math.floor(Math.random() * this.gridSize);
            positionKey = `${selectedWall}-${gridX}-${gridZ}`;
            attempts++;
        } while (this.occupiedPositions.has(positionKey) && attempts < 10);
        if (this.occupiedPositions.has(positionKey)) {
            return;
        }
        this.occupiedPositions.add(positionKey);
        
        // Calculate cell size
        const cellSize = (this.gridSize * 2) / this.gridSize;
        
        // Determine target height based on music intensity (variable heights)
        const totalIntensity = bassIntensity + midIntensity + highIntensity;
        let targetHeight;
        
        if (bassIntensity > midIntensity && bassIntensity > highIntensity) {
            // Bass dominant - tallest blocks
            targetHeight = this.minCellHeight + (bassIntensity * this.maxCellHeight * 1);
        } else if (midIntensity > highIntensity) {
            // Mid dominant - medium blocks
            targetHeight = this.minCellHeight + (midIntensity * this.maxCellHeight * 2);
        } else {
            // High dominant - shorter, quicker blocks
            targetHeight = this.minCellHeight + (highIntensity * this.maxCellHeight * 2.5);
        }
        
        // Add some randomness to heights for variety
        targetHeight *= (0.8 + Math.random() * 0.4);// Create geometry based on wall orientation
        // All geometries start as thin rectangles and will be scaled during animation
        let cellGeometry;
        
        switch (selectedWall) {
            case 'floor':
                // Floor blocks grow upward (Y direction) - start as thin horizontal plane
                cellGeometry = new THREE.BoxGeometry(cellSize, 0.1, cellSize);
                break;
            case 'back':
            case 'front':
                // Back/Front walls grow in Z direction - start as thin vertical plane
                cellGeometry = new THREE.BoxGeometry(cellSize, cellSize, 0.1);
                break;
            case 'left':
            case 'right':
                // Left/Right walls grow in X direction - start as thin vertical plane
                cellGeometry = new THREE.BoxGeometry(0.1, cellSize, cellSize);
                break;
        }
        
        // Create wireframe mesh
        const wireframeMesh = new THREE.Mesh(cellGeometry.clone(), this.wireframeMaterial.clone());
        
        // Remove fill mesh - only use wireframe for grid lines        // Set position based on wall - blocks start AT wall surface and grow inward
        let basePosition;
        
        switch (selectedWall) {
            case 'floor':
                basePosition = new THREE.Vector3(
                    -this.gridSize + gridX * cellSize + cellSize/2,
                    -10, // Start exactly at floor surface
                    -this.gridSize + gridZ * cellSize + cellSize/2
                );
                break;
                
            case 'back':
                basePosition = new THREE.Vector3(
                    -this.gridSize + gridX * cellSize + cellSize/2,
                    -10 + gridZ * cellSize + cellSize/2,
                    -this.gridSize // Start exactly at back wall surface
                );
                break;
                
            case 'left':
                basePosition = new THREE.Vector3(
                    -this.gridSize, // Start exactly at left wall surface
                    -10 + gridZ * cellSize + cellSize/2,
                    -this.gridSize + gridX * cellSize + cellSize/2
                );
                break;
                
            case 'right':
                basePosition = new THREE.Vector3(
                    this.gridSize, // Start exactly at right wall surface
                    -10 + gridZ * cellSize + cellSize/2,
                    -this.gridSize + gridX * cellSize + cellSize/2
                );
                break;
                
            case 'front':
                basePosition = new THREE.Vector3(
                    -this.gridSize + gridX * cellSize + cellSize/2,
                    -10 + gridZ * cellSize + cellSize/2,
                    this.gridSize // Start exactly at front wall surface
                );
                break;
        }
        
        // Set initial position for wireframe mesh
        wireframeMesh.position.copy(basePosition);
        
        // Set initial scale - starts very thin and will grow during animation
        if (selectedWall === 'floor') {
            wireframeMesh.scale.y = 0.01;
        } else if (selectedWall === 'back' || selectedWall === 'front') {
            wireframeMesh.scale.z = 0.01;
        } else { // left or right
            wireframeMesh.scale.x = 0.01;
        }
        
        // Determine lifespan based on intensity (more intense = longer lasting)
        const lifespan = this.cellLifespan * (0.8 + totalIntensity * 0.4);
        
        // Add to scene
        this.scene.add(wireframeMesh);
        
        // Add to active cells
        this.activeCells.push({
            wireframeMesh: wireframeMesh,
            mesh: wireframeMesh, // For backwards compatibility
            basePosition: basePosition,
            life: lifespan,
            maxLife: lifespan,
            targetHeight: targetHeight,
            wall: selectedWall,
            positionKey: positionKey, // Store for cleanup when cell expires
            gridX: gridX,
            gridZ: gridZ
        });
    }    // Easing functions for smooth animations
    easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeIn(t) {
        return Math.pow(t, 3);
    }
    
    updateColors(gridColor, backgroundColor) {
        // Update stored colors
        this.gridColor = gridColor;
        this.backgroundColor = backgroundColor;
        
        // Update base wireframe material
        this.wireframeMaterial.color.setHex(gridColor);
        
        // Update existing cells
        for (const cell of this.activeCells) {
            cell.wireframeMesh.material.color.setHex(gridColor);
        }
    }
      // Clean up all cells
    dispose() {
        for (const cell of this.activeCells) {
            this.scene.remove(cell.wireframeMesh);
            cell.wireframeMesh.geometry.dispose();
            cell.wireframeMesh.material.dispose();
        }
        this.activeCells = [];
        this.occupiedPositions.clear(); // Clear all occupied positions
    }
}
