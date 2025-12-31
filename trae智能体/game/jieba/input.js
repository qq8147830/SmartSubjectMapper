class InputManager {
    constructor() {
        this.keys = {};
        this.previousKeys = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
    }
    
    update() {
        this.previousKeys = { ...this.keys };
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] && !this.previousKeys[keyCode];
    }
    
    isKeyDown(keyCode) {
        return this.keys[keyCode];
    }
    
    getPlayerAInput() {
        return {
            left: this.isKeyDown('KeyA'),
            right: this.isKeyDown('KeyD'),
            jump: this.isKeyDown('KeyW'),
            crouch: this.isKeyDown('KeyS'),
            lightAttack: this.isKeyPressed('KeyJ'),
            heavyAttack: this.isKeyPressed('KeyK'),
            special: this.isKeyPressed('KeyL'),
            ultimate: this.isKeyPressed('KeyI'),
            super: this.isKeyPressed('KeyO'),
            
            lightAttackDown: this.isKeyDown('KeyJ'),
            heavyAttackDown: this.isKeyDown('KeyK'),
            specialDown: this.isKeyDown('KeyL'),
            ultimateDown: this.isKeyDown('KeyI'),
            superDown: this.isKeyDown('KeyO')
        };
    }
    
    getPlayerBInput() {
        return {
            left: this.isKeyDown('ArrowLeft'),
            right: this.isKeyDown('ArrowRight'),
            jump: this.isKeyDown('ArrowUp'),
            crouch: this.isKeyDown('ArrowDown'),
            lightAttack: this.isKeyPressed('Digit1'),
            heavyAttack: this.isKeyPressed('Digit2'),
            special: this.isKeyPressed('Digit3'),
            ultimate: this.isKeyPressed('Digit4'),
            super: this.isKeyPressed('Digit5'),
            
            lightAttackDown: this.isKeyDown('Digit1'),
            heavyAttackDown: this.isKeyDown('Digit2'),
            specialDown: this.isKeyDown('Digit3'),
            ultimateDown: this.isKeyDown('Digit4'),
            superDown: this.isKeyDown('Digit5')
        };
    }
    
    reset() {
        this.keys = {};
        this.previousKeys = {};
    }
}