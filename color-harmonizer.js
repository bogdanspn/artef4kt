/**
 * Color Harmonizer - Generates aesthetically pleasing color schemes
 * Creates harmonious color combinations using color theory principles
 */
class ColorHarmonizer {
    constructor() {
        // Predefined harmonious color schemes
        this.colorSchemes = {
            // Monochromatic schemes - variations of single hue
            monochromatic: [
                {
                    name: "Ocean Blues",
                    grid: "#4A90E2",
                    shadow: "#2C5AA0",
                    background: "#1E3A5F",
                    environment: "#6BB6FF",
                    lights: ["#E74C3C", "#F39C12", "#8E44AD"]
                },
                {
                    name: "Forest Greens",
                    grid: "#2ECC71",
                    shadow: "#27AE60",
                    background: "#1E8449",
                    environment: "#58D68D",
                    lights: ["#E74C3C", "#F39C12", "#3498DB"]
                },
                {
                    name: "Sunset Oranges",
                    grid: "#FF6B35",
                    shadow: "#C0392B",
                    background: "#922B21",
                    environment: "#FF8C69",
                    lights: ["#3498DB", "#2ECC71", "#9B59B6"]
                }
            ],
            
            // Complementary schemes - opposite colors on color wheel
            complementary: [
                {
                    name: "Fire & Ice",
                    grid: "#FF4500",
                    shadow: "#8B0000",
                    background: "#2F4F4F",
                    environment: "#87CEEB",
                    lights: ["#FF6347", "#00CED1", "#DA70D6"]
                },
                {
                    name: "Electric Purple",
                    grid: "#9932CC",
                    shadow: "#4B0082",
                    background: "#2F2F2F",
                    environment: "#32CD32",
                    lights: ["#FF1493", "#00FF7F", "#FFD700"]
                },
                {
                    name: "Cyber Gold",
                    grid: "#FFD700",
                    shadow: "#B8860B",
                    background: "#191970",
                    environment: "#4169E1",
                    lights: ["#FF00FF", "#00FFFF", "#FF4500"]
                }
            ],
            
            // Triadic schemes - three evenly spaced colors
            triadic: [
                {
                    name: "RGB Classic",
                    grid: "#FF0080",
                    shadow: "#800040",
                    background: "#004080",
                    environment: "#0080FF",
                    lights: ["#FF4000", "#80FF00", "#0040FF"]
                },
                {
                    name: "Neon Dreams",
                    grid: "#00FF80",
                    shadow: "#008040",
                    background: "#400080",
                    environment: "#8000FF",
                    lights: ["#FF8000", "#00FF40", "#4000FF"]
                },
                {
                    name: "Retro Wave",
                    grid: "#FF0040",
                    shadow: "#800020",
                    background: "#200080",
                    environment: "#4000FF",
                    lights: ["#FF4080", "#80FF40", "#4080FF"]
                }
            ],
            
            // Analogous schemes - adjacent colors on wheel
            analogous: [
                {
                    name: "Warm Sunset",
                    grid: "#FF6B35",
                    shadow: "#C0392B",
                    background: "#8B4513",
                    environment: "#DAA520",
                    lights: ["#FF4500", "#FF8C00", "#FFD700"]
                },
                {
                    name: "Cool Ocean",
                    grid: "#1ABC9C",
                    shadow: "#148F77",
                    background: "#0E6655",
                    environment: "#45B7D1",
                    lights: ["#3498DB", "#2980B9", "#8E44AD"]
                },
                {
                    name: "Pink Sakura",
                    grid: "#E91E63",
                    shadow: "#AD1457",
                    background: "#6A1B29",
                    environment: "#F8BBD9",
                    lights: ["#FF69B4", "#DA70D6", "#BA55D3"]
                }
            ],
            
            // Split complementary schemes
            splitComplementary: [
                {
                    name: "Cyberpunk",
                    grid: "#00FFFF",
                    shadow: "#008B8B",
                    background: "#2F2F2F",
                    environment: "#FF1493",
                    lights: ["#FF00FF", "#FFFF00", "#00FF00"]
                },
                {
                    name: "Synthwave",
                    grid: "#FF00FF",
                    shadow: "#8B008B",
                    background: "#1a0033",
                    environment: "#00FFFF",
                    lights: ["#FF0080", "#80FF80", "#8080FF"]
                }
            ],
            
            // Dark themes
            dark: [
                {
                    name: "Matrix",
                    grid: "#00FF41",
                    shadow: "#008F11",
                    background: "#0D0208",
                    environment: "#003B00",
                    lights: ["#00FF41", "#00CC33", "#39FF14"]
                },
                {
                    name: "Deep Space",
                    grid: "#4A90E2",
                    shadow: "#1C3A5E",
                    background: "#0B1426",
                    environment: "#2C5282",
                    lights: ["#E74C3C", "#F39C12", "#9B59B6"]
                },
                {
                    name: "Midnight",
                    grid: "#8892B0",
                    shadow: "#495670",
                    background: "#0A0E27",
                    environment: "#1E2749",
                    lights: ["#64FFDA", "#FF6B9D", "#C792EA"]
                }
            ],
            
            // High contrast themes
            highContrast: [
                {
                    name: "Stark",
                    grid: "#FFFFFF",
                    shadow: "#808080",
                    background: "#000000",
                    environment: "#404040",
                    lights: ["#FF0000", "#00FF00", "#0000FF"]
                },
                {
                    name: "Inverse",
                    grid: "#000000",
                    shadow: "#404040",
                    background: "#FFFFFF",
                    environment: "#C0C0C0",
                    lights: ["#FF0000", "#00FF00", "#0000FF"]
                }
            ]
        };
        
        // All schemes flattened for random selection
        this.allSchemes = [];
        Object.values(this.colorSchemes).forEach(category => {
            this.allSchemes.push(...category);
        });
    }
    
    /**
     * Generate a random harmonious color scheme
     * @returns {Object} Color scheme with hex values for all components
     */
    generateRandomScheme() {
        const randomIndex = Math.floor(Math.random() * this.allSchemes.length);
        const scheme = this.allSchemes[randomIndex];
        
        // Add some random variation to make it feel more dynamic
        const variation = Math.random() * 0.2 - 0.1; // ±10% variation
        
        return {
            name: scheme.name,
            grid: this.varyColor(scheme.grid, variation * 0.5),
            shadow: this.varyColor(scheme.shadow, variation * 0.3),
            background: this.varyColor(scheme.background, variation * 0.2),
            environment: this.varyColor(scheme.environment, variation * 0.4),
            lights: scheme.lights.map(color => this.varyColor(color, variation * 0.3))
        };
    }
    
    /**
     * Get a specific color scheme by category and index
     * @param {string} category - The category name
     * @param {number} index - Index within the category
     * @returns {Object} Color scheme
     */
    getScheme(category, index = null) {
        if (!this.colorSchemes[category]) {
            throw new Error(`Category ${category} not found`);
        }
        
        const schemes = this.colorSchemes[category];
        if (index === null) {
            index = Math.floor(Math.random() * schemes.length);
        }
        
        return schemes[index % schemes.length];
    }
    
    /**
     * Add subtle variation to a color
     * @param {string} hexColor - Hex color string
     * @param {number} variation - Variation amount (-1 to 1)
     * @returns {string} Modified hex color
     */
    varyColor(hexColor, variation) {
        // Convert hex to RGB
        const hex = hexColor.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Apply variation
        const varyAmount = Math.floor(variation * 30); // Max ±30 RGB units
        const newR = Math.max(0, Math.min(255, r + varyAmount));
        const newG = Math.max(0, Math.min(255, g + varyAmount));
        const newB = Math.max(0, Math.min(255, b + varyAmount));
        
        // Convert back to hex
        const toHex = (num) => {
            const hex = num.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }
    
    /**
     * Convert hex color to RGB integer (for Three.js)
     * @param {string} hexColor - Hex color string
     * @returns {number} RGB integer
     */
    hexToRgbInt(hexColor) {
        return parseInt(hexColor.replace('#', ''), 16);
    }
    
    /**
     * Get all available category names
     * @returns {Array} Array of category names
     */
    getCategories() {
        return Object.keys(this.colorSchemes);
    }
    
    /**
     * Get the number of schemes in a category
     * @param {string} category - Category name
     * @returns {number} Number of schemes
     */
    getCategorySize(category) {
        return this.colorSchemes[category]?.length || 0;
    }
}

// Export for use in other scripts
window.ColorHarmonizer = ColorHarmonizer;