class InputManager {
    constructor() {
        // 初始化所有可能的键值为 false
        this.keys = {
            // Player A 键
            'KeyA': false, 'KeyD': false, 'KeyW': false, 'KeyS': false,
            'Digit1': false, 'Digit2': false, 'Digit3': false, 'Digit4': false, 'Digit5': false,
            
            // Player B 键
            'ArrowLeft': false, 'ArrowRight': false, 'ArrowUp': false, 'ArrowDown': false,
            'KeyJ': false, 'KeyK': false, 'KeyL': false, 'KeyI': false, 'KeyO': false,
            
            // 其他键
            'Space': false, 'Enter': false, 'Equal': false
        };
        this.previousKeys = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        console.log('=== InputManager: Setting up keyboard event listeners ===');
        console.log('InputManager this:', this);
        
        // 统一使用document，移除对window的监听
        const keydownHandler = (event) => {
            console.log('🎮 InputManager - Keydown:', event.code, 'Key:', event.key, 'Time:', Date.now());
            
            // 确保键存在并设置为true
            if (this.keys.hasOwnProperty(event.code)) {
                this.keys[event.code] = true;
                console.log('🎯 Key pressed and recorded:', event.code);
            } else {
                console.log('⚠️ Unknown key pressed:', event.code);
            }
            
            // 调试输出：打印所有按键事件
            if (event.code.startsWith('Arrow') || event.code.startsWith('Key') || event.code.startsWith('Digit')) {
                console.log('🎯 Game-relevant key pressed:', event.code);
            }
        };
        
        const keyupHandler = (event) => {
            console.log('🎮 InputManager - Keyup:', event.code, 'Key:', event.key, 'Time:', Date.now());
            
            // 确保键存在并设置为false
            if (this.keys.hasOwnProperty(event.code)) {
                this.keys[event.code] = false;
                console.log('🎯 Key released and recorded:', event.code);
            } else {
                console.log('⚠️ Unknown key released:', event.code);
            }
            
            // 调试输出：打印释放事件
            if (event.code.startsWith('Arrow') || event.code.startsWith('Key') || event.code.startsWith('Digit')) {
                console.log('🎯 Game-relevant key released:', event.code);
            }
        };
        
        // 先移除可能存在的旧监听器
        if (this._keydownHandler) {
            document.removeEventListener('keydown', this._keydownHandler);
            document.removeEventListener('keyup', this._keyupHandler);
        }
        
        // 设置新的监听器并保存引用
        this._keydownHandler = keydownHandler;
        this._keyupHandler = keyupHandler;
        
        document.addEventListener('keydown', keydownHandler);
        document.addEventListener('keyup', keyupHandler);
        
        console.log('✅ InputManager - Keyboard event listeners setup complete');
        console.log('Initialized keys:', Object.keys(this.keys));
    }
    
    update() {
        this.previousKeys = { ...this.keys };
    }
    
    isKeyPressed(keyCode) {
        const currentKey = this.keys[keyCode];
        const previousKey = this.previousKeys[keyCode];
        
        // 确保键值存在且为true才认为是按下状态
        return currentKey === true && previousKey !== true;
    }
    
    isKeyDown(keyCode) {
        const keyValue = this.keys[keyCode];
        // 只有当键值明确为true时才返回true，否则返回false
        return keyValue === true;
    }
    
    getPlayerAInput() {
        return {
            left: this.isKeyDown('KeyA'),
            right: this.isKeyDown('KeyD'),
            jump: this.isKeyDown('KeyW'),
            crouch: this.isKeyDown('KeyS'),
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
    
    getPlayerBInput() {
        const input = {
            left: this.isKeyDown('ArrowLeft'),
            right: this.isKeyDown('ArrowRight'),
            jump: this.isKeyDown('ArrowUp'),
            crouch: this.isKeyDown('ArrowDown'),
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
        
        // 调试输出：打印所有按键状态
        console.log('PlayerB Raw Input States:', {
            ArrowLeft: this.keys['ArrowLeft'],
            ArrowRight: this.keys['ArrowRight'],
            ArrowUp: this.keys['ArrowUp'],
            ArrowDown: this.keys['ArrowDown'],
            KeyJ: this.keys['KeyJ'],
            KeyK: this.keys['KeyK'],
            KeyL: this.keys['KeyL'],
            KeyI: this.keys['KeyI'],
            KeyO: this.keys['KeyO']
        });
        
        // 调试输出：只有在有输入时打印
        if (input.left || input.right || input.jump || input.crouch || 
            input.lightAttackDown || input.heavyAttackDown || input.specialDown || 
            input.ultimateDown || input.superDown) {
            console.log('PlayerB Input Debug:', input);
        }
        
        return input;
    }
    
    reset() {
        this.keys = {};
        this.previousKeys = {};
    }
}