class Game {
    constructor() {
        console.log('🎮 Game - Constructor called');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.gameState = 'menu';
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.playerA = null;
        this.playerB = null;
        
        this.roundTimer = 99;
        this.roundActive = false;
        
        this.comboSystem = {
            currentCombo: 0,
            comboTimer: 0,
            maxComboTime: 2000,
            lastAttacker: null
        };
        
        this.effects = [];
        this.projectiles = [];
        
        this.audioSystem = new AudioSystem();
        
        console.log('🎮 Game - About to call init()');
        this.init();
        console.log('🎮 Game - Constructor complete');
    }
    
    init() {
        this.setupEventListeners();
        this.setupInput();
        this.setupUI();
        this.setupStartButton();
        this.loadCharacters();
        this.gameState = 'menu';
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
    }
    
    setupInput() {
        console.log('🎮 Game - Setting up input manager');
        this.inputManager = new InputManager();
        console.log('🎮 Game - Input manager created:', this.inputManager);
    }
    
    setupUI() {
        this.uiSystem = new UISystem(this);
        this.setupAudioControls();
    }
    
    setupAudioControls() {
        this.audioControls = new AudioControls(this.audioSystem);
    }
    
    setupStartButton() {
        const startBtn = document.getElementById('startGameBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startGame();
                startBtn.style.display = 'none';
            });
        }
        
        // 添加键盘支持（空格键和回车键）
        this.setupKeyboardStart();
    }
    
    setupKeyboardStart() {
        // 移除旧的监听器
        if (this._keyboardStartHandler) {
            document.removeEventListener('keydown', this._keyboardStartHandler);
            this._keyboardStartHandler = null;
        }

        this._keyboardStartHandler = (e) => {
            // 只在菜单状态下响应
            if (this.gameState !== 'menu') return;
            
            // 检查是否是空格或回车键
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                this.startGame();
                
                // 隐藏开始按钮和说明
                const startBtn = document.getElementById('startGameBtn');
                if (startBtn) {
                    startBtn.style.display = 'none';
                }
            }
        };

        document.addEventListener('keydown', this._keyboardStartHandler);
    }
    
    loadCharacters() {
        this.playerA = new Fighter('playerA', 100, 300, 'fireWarrior');
        this.playerB = new Fighter('playerB', 900, 300, 'thunderMage');
        
        this.playerA.isFacingRight = false;
        this.playerB.isFacingRight = true;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.roundActive = true;
        this.roundTimer = 99;
        this.resetRound();
        
        // 隐藏开始界面元素
        this.hideStartInterface();
    }
    
    hideStartInterface() {
        const startBtn = document.getElementById('startGameBtn');
        const startInstruction = document.querySelector('.start-instruction');
        
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        
        if (startInstruction) {
            startInstruction.style.display = 'none';
        }
    }
    
    resetRound() {
        this.playerA.reset(100, 300);
        this.playerB.reset(900, 300);
        this.playerA.isFacingRight = false;
        this.playerB.isFacingRight = true;
        
        this.comboSystem.currentCombo = 0;
        this.comboSystem.comboTimer = 0;
        this.comboSystem.lastAttacker = null;
        
        this.effects = [];
        this.projectiles = [];
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const aspectRatio = this.width / this.height;
        let newWidth = containerWidth;
        let newHeight = containerWidth / aspectRatio;
        
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
        }
        
        this.canvas.style.width = newWidth + 'px';
        this.canvas.style.height = newHeight + 'px';
    }
    
    update(deltaTime) {
        this.deltaTime = deltaTime;
        
        if (this.gameState === 'playing') {
            // 先更新输入，再处理游戏逻辑
            this.updateInput();
            
            this.updateRoundTimer(deltaTime);
            this.updatePlayers(deltaTime);
            this.updateEffects(deltaTime);
            this.updateProjectiles(deltaTime);
            this.updateComboSystem(deltaTime);
            this.checkCollisions();
            this.checkWinCondition();
        }
        
        this.updateUI(deltaTime);
    }
    
    updateRoundTimer(deltaTime) {
        if (this.roundActive) {
            this.roundTimer -= deltaTime / 1000;
            if (this.roundTimer <= 0) {
                this.roundTimer = 0;
                this.endRound();
            }
        }
    }
    
    updatePlayers(deltaTime) {
        const playerAInput = this.inputManager.getPlayerAInput();
        const playerBInput = this.inputManager.getPlayerBInput();
        
        // 调试输出：追踪输入传递给角色的过程
        if (this.gameState === 'playing') {
            console.log('Game Update - PlayerB Input:', playerBInput);
        }
        
        if (this.playerA) this.playerA.update(deltaTime, playerAInput);
        if (this.playerB) this.playerB.update(deltaTime, playerBInput);
        
        this.updatePlayerPositions();
    }
    
    updatePlayerPositions() {
        if (!this.playerA || !this.playerB) return;
        
        const minDistance = 60;
        const distance = Math.abs(this.playerA.x - this.playerB.x);
        
        if (distance < minDistance) {
            const overlap = minDistance - distance;
            const moveAmount = overlap / 2;
            
            if (this.playerA.x < this.playerB.x) {
                this.playerA.x -= moveAmount;
                this.playerB.x += moveAmount;
            } else {
                this.playerA.x += moveAmount;
                this.playerB.x -= moveAmount;
            }
        }
        
        this.playerA.isFacingRight = this.playerA.x < this.playerB.x;
        this.playerB.isFacingRight = this.playerB.x < this.playerA.x;
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isFinished();
        });
    }
    
    updateProjectiles(deltaTime) {
        this.projectiles = this.projectiles.filter(projectile => {
            projectile.update(deltaTime);
            return !projectile.isFinished() && 
                   projectile.x > -100 && 
                   projectile.x < this.width + 100;
        });
    }
    
    updateComboSystem(deltaTime) {
        if (this.comboSystem.currentCombo > 0) {
            this.comboSystem.comboTimer -= deltaTime;
            if (this.comboSystem.comboTimer <= 0) {
                this.comboSystem.currentCombo = 0;
            }
        }
    }
    
    updateInput() {
        this.inputManager.update();
    }
    
    updateUI(deltaTime) {
        if (this.uiSystem) {
            this.uiSystem.update(deltaTime);
        }
    }
    
    checkCollisions() {
        this.checkProjectileCollisions();
        this.checkAttackCollisions();
    }
    
    checkProjectileCollisions() {
        this.projectiles.forEach(projectile => {
            if (projectile.owner !== this.playerA && this.checkCollision(projectile, this.playerA)) {
                this.playerA.takeDamage(projectile.damage);
                this.addCombo(projectile.owner);
                this.createHitEffect(projectile.x, projectile.y);
                this.playHitSound(projectile.type);
                projectile.finish();
            }
            
            if (projectile.owner !== this.playerB && this.checkCollision(projectile, this.playerB)) {
                this.playerB.takeDamage(projectile.damage);
                this.addCombo(projectile.owner);
                this.createHitEffect(projectile.x, projectile.y);
                this.playHitSound(projectile.type);
                projectile.finish();
            }
        });
    }
    
    checkAttackCollisions() {
        if (this.playerA.isAttacking() && this.checkCollision(this.playerA, this.playerB)) {
            if (this.playerA.canHit()) {
                const damage = this.playerA.getCurrentAttackDamage();
                const knockback = 150;
                const direction = this.playerA.isFacingRight ? 1 : -1;
                this.playerB.takeDamage(damage, knockback, direction);
                this.addCombo(this.playerA);
                this.createHitEffect(this.playerB.x, this.playerB.y);
                this.audioSystem.playSound('hit');
                this.playerA.markAsHit();
            }
        }
        
        if (this.playerB.isAttacking() && this.checkCollision(this.playerB, this.playerA)) {
            if (this.playerB.canHit()) {
                const damage = this.playerB.getCurrentAttackDamage();
                const knockback = 150;
                const direction = this.playerB.isFacingRight ? 1 : -1;
                this.playerA.takeDamage(damage, knockback, direction);
                this.addCombo(this.playerB);
                this.createHitEffect(this.playerA.x, this.playerA.y);
                this.audioSystem.playSound('hit');
                this.playerB.markAsHit();
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    addCombo(attacker) {
        if (this.comboSystem.lastAttacker === attacker) {
            this.comboSystem.currentCombo++;
        } else {
            this.comboSystem.currentCombo = 1;
        }
        
        this.comboSystem.lastAttacker = attacker;
        this.comboSystem.comboTimer = this.comboSystem.maxComboTime;
        
        if (attacker.energy < attacker.maxEnergy) {
            attacker.energy = Math.min(attacker.energy + 10, attacker.maxEnergy);
        }
        
        if (this.comboSystem.currentCombo > 1) {
            this.audioSystem.playSound('combo');
        }
    }
    
    createHitEffect(x, y) {
        this.effects.push(new HitEffect(x, y));
    }
    
    createProjectile(owner, x, y, direction, damage, type) {
        this.projectiles.push(new Projectile(owner, x, y, direction, damage, type));
    }
    
    playHitSound(projectileType) {
        if (this.audioSystem) {
            const soundMap = {
                'fireball': 'fireball',
                'lightning': 'lightning',
                'ice': 'ice',
                'wind': 'wind',
                'rock': 'rock',
                'shadow': 'shadow'
            };
            const soundName = soundMap[projectileType] || 'hit';
            this.audioSystem.playSound(soundName);
        }
    }
    
    playSpecialAbilitySound(abilityType) {
        if (this.audioSystem) {
            const soundMap = {
                'fireball': 'fireball',
                'lightning': 'lightning',
                'ice': 'ice',
                'wind': 'wind',
                'rock': 'rock',
                'shadow': 'shadow'
            };
            const soundName = soundMap[abilityType] || 'special';
            this.audioSystem.playSound(soundName);
        }
    }
    
    checkWinCondition() {
        if (this.playerA.hp <= 0 || this.playerB.hp <= 0) {
            this.endRound();
        }
    }
    
    endRound() {
        this.roundActive = false;
        
        let winner = null;
        if (this.playerA.hp <= 0 && this.playerB.hp <= 0) {
            winner = 'draw';
        } else if (this.playerA.hp <= 0) {
            winner = 'Player B';
        } else if (this.playerB.hp <= 0) {
            winner = 'Player A';
        } else if (this.roundTimer <= 0) {
            winner = this.playerA.hp > this.playerB.hp ? 'Player A' : 'Player B';
        }
        
        setTimeout(() => {
            this.startGame();
        }, 3000);
    }
    
    render() {
        this.clearCanvas();
        
        if (this.gameState === 'playing') {
            this.renderBackground();
            this.renderPlayers();
            this.renderProjectiles();
            this.renderEffects();
        }
        
        if (this.uiSystem) {
            this.uiSystem.render(this.ctx);
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#98FB98');
        gradient.addColorStop(1, '#228B22');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.height - 100, this.width, 100);
        
        this.ctx.strokeStyle = '#654321';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.width; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.height - 100);
            this.ctx.lineTo(i + 20, this.height - 80);
            this.ctx.stroke();
        }
    }
    
    renderPlayers() {
        if (this.playerA) this.playerA.render(this.ctx);
        if (this.playerB) this.playerB.render(this.ctx);
    }
    
    renderProjectiles() {
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
    }
    
    renderEffects() {
        this.effects.forEach(effect => effect.render(this.ctx));
    }
    
    renderUI() {
        this.updateHealthBars();
        this.updateEnergyBars();
        this.updateComboDisplay();
        this.updateTimerDisplay();
    }
    
    updateHealthBars() {
        const playerAHealthBar = document.getElementById('playerAHealth');
        const playerBHealthBar = document.getElementById('playerBHealth');
        
        if (playerAHealthBar && this.playerA) {
            const healthPercent = (this.playerA.hp / this.playerA.maxHp) * 100;
            playerAHealthBar.style.width = Math.max(0, healthPercent) + '%';
        }
        
        if (playerBHealthBar && this.playerB) {
            const healthPercent = (this.playerB.hp / this.playerB.maxHp) * 100;
            playerBHealthBar.style.width = Math.max(0, healthPercent) + '%';
        }
    }
    
    updateEnergyBars() {
        const playerAEnergyBar = document.getElementById('playerAEnergy');
        const playerBEnergyBar = document.getElementById('playerBEnergy');
        
        if (playerAEnergyBar && this.playerA) {
            const energyPercent = (this.playerA.energy / this.playerA.maxEnergy) * 100;
            playerAEnergyBar.style.width = energyPercent + '%';
        }
        
        if (playerBEnergyBar && this.playerB) {
            const energyPercent = (this.playerB.energy / this.playerB.maxEnergy) * 100;
            playerBEnergyBar.style.width = energyPercent + '%';
        }
    }
    
    updateComboDisplay() {
        const comboCounter = document.getElementById('comboCounter');
        if (comboCounter && this.comboSystem.currentCombo > 0) {
            comboCounter.textContent = `COMBO x${this.comboSystem.currentCombo}`;
            comboCounter.style.display = 'block';
        } else if (comboCounter) {
            comboCounter.style.display = 'none';
        }
    }
    
    updateTimerDisplay() {
        const timer = document.getElementById('gameTimer');
        if (timer) {
            timer.textContent = Math.ceil(this.roundTimer);
        }
    }
    
    gameLoop(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
        }
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

const game = new Game();
window.game = game;

requestAnimationFrame((time) => game.gameLoop(time));