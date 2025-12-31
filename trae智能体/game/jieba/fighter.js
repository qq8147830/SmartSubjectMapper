class Fighter {
    constructor(name, x, y, characterType) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.characterType = characterType;
        
        this.width = 50;
        this.height = 100;
        
        this.vx = 0;
        this.vy = 0;
        
        this.maxHp = 1000;
        this.hp = this.maxHp;
        this.maxEnergy = 100;
        this.energy = 0;
        
        this.baseStats = this.getBaseStats();
        this.speed = this.baseStats.speed;
        this.attack = this.baseStats.attack;
        this.defense = this.baseStats.defense;
        
        this.state = 'idle';
        this.isFacingRight = true;
        this.onGround = false;
        this.hasHit = false;
        
        this.animations = {};
        this.currentAnimation = 'idle';
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 100;
        
        this.attackData = this.getAttackData();
        this.currentAttack = null;
        this.attackTimer = 0;
        
        this.comboCount = 0;
        this.comboTimer = 0;
        this.maxComboTime = 2000;
        
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        
        this.specialEffects = [];
    }
    
    getBaseStats() {
        const stats = {
            fireWarrior: { speed: 1.0, attack: 1.2, defense: 0.8, color: '#ff4444' },
            thunderMage: { speed: 1.3, attack: 0.9, defense: 0.9, color: '#ffaa00' },
            iceKnight: { speed: 0.7, attack: 0.9, defense: 1.3, color: '#00aaff' },
            windNinja: { speed: 1.5, attack: 0.8, defense: 0.7, color: '#88ff88' },
            rockGiant: { speed: 0.5, attack: 1.1, defense: 1.5, color: '#8B4513' },
            shadowAssassin: { speed: 1.1, attack: 1.4, defense: 0.6, color: '#4B0082' }
        };
        
        return stats[this.characterType] || stats.fireWarrior;
    }
    
    getAttackData() {
        return {
            light: {
                name: 'light',
                damage: 50,
                range: 60,
                windup: 100,
                active: 200,
                recovery: 300,
                knockback: 150,
                hitstun: 500
            },
            heavy: {
                name: 'heavy',
                damage: 100,
                range: 70,
                windup: 200,
                active: 300,
                recovery: 500,
                knockback: 250,
                hitstun: 700
            },
            special: {
                name: 'special',
                damage: 80,
                range: 80,
                windup: 150,
                active: 250,
                recovery: 400,
                knockback: 200,
                hitstun: 600,
                energyCost: 30
            },
            ultimate: {
                name: 'ultimate',
                damage: 150,
                range: 100,
                windup: 300,
                active: 400,
                recovery: 600,
                knockback: 350,
                hitstun: 1000,
                energyCost: 50
            },
            super: {
                name: 'super',
                damage: 300,
                range: 120,
                windup: 500,
                active: 600,
                recovery: 800,
                knockback: 500,
                hitstun: 1500,
                energyCost: 100
            }
        };
    }
    
    update(deltaTime, input) {
        this.handleInput(input);
        this.updatePhysics(deltaTime);
        this.updateAnimations(deltaTime);
        this.updateAttack(deltaTime);
        this.updateSpecialEffects(deltaTime);
        this.updateInvulnerability(deltaTime);
        this.updateCombo(deltaTime);
    }
    
    handleInput(input) {
        if (this.state === 'hitstun' || this.state === 'knockdown') return;
        
        const speed = this.speed * (input.crouch ? 0.5 : 1);
        
        if (input.left && !input.right) {
            this.vx = -speed * 300;
            this.state = this.onGround ? 'walk' : 'air';
        } else if (input.right && !input.left) {
            this.vx = speed * 300;
            this.state = this.onGround ? 'walk' : 'air';
        } else {
            this.vx = 0;
            if (this.onGround && this.state !== 'attack' && this.state !== 'hitstun') {
                this.state = 'idle';
            }
        }
        
        if (input.jump && this.onGround) {
            this.vy = -400;
            this.onGround = false;
            this.state = 'jump';
            if (window.game && window.game.audioSystem) {
                window.game.audioSystem.playSound('jump');
            }
        }
        
        if (input.crouch && this.onGround && this.state !== 'attack') {
            this.state = 'crouch';
        }
        
        this.handleAttacks(input);
    }
    
    handleAttacks(input) {
        if (this.state === 'hitstun' || this.state === 'knockdown') return;
        
        if (input.lightAttack && this.canAttack()) {
            this.startAttack('light');
        } else if (input.heavyAttack && this.canAttack()) {
            this.startAttack('heavy');
        } else if (input.special && this.canAttack() && this.energy >= this.attackData.special.energyCost) {
            this.startAttack('special');
        } else if (input.ultimate && this.canAttack() && this.energy >= this.attackData.ultimate.energyCost) {
            this.startAttack('ultimate');
        } else if (input.super && this.canAttack() && this.energy >= this.attackData.super.energyCost) {
            this.startAttack('super');
        }
    }
    
    canAttack() {
        return this.state !== 'attack' && this.state !== 'hitstun' && this.state !== 'knockdown' && this.onGround;
    }
    
    startAttack(attackType) {
        this.state = 'attack';
        this.currentAttack = attackType;
        this.attackTimer = 0;
        this.hasHit = false;
        
        const attack = this.attackData[attackType];
        if (attack.energyCost) {
            this.energy -= attack.energyCost;
        }
        
        this.playAttackSound(attackType);
        this.executeSpecialAttack(attackType);
    }
    
    playAttackSound(attackType) {
        if (window.game && window.game.audioSystem) {
            let soundName = 'punch';
            
            switch (attackType) {
                case 'light':
                    soundName = 'punch';
                    break;
                case 'heavy':
                    soundName = 'kick';
                    break;
                case 'special':
                    soundName = 'special';
                    break;
                case 'ultimate':
                    soundName = 'ultimate';
                    break;
                case 'super':
                    soundName = 'ultimate';
                    break;
            }
            
            window.game.audioSystem.playSound(soundName);
        }
    }
    
    executeSpecialAttack(attackType) {
        switch (attackType) {
            case 'special':
                if (this.characterType === 'fireWarrior') {
                    this.createFireball();
                } else if (this.characterType === 'thunderMage') {
                    this.createLightningChain();
                } else if (this.characterType === 'iceKnight') {
                    this.createIceWall();
                } else if (this.characterType === 'windNinja') {
                    this.createTornado();
                } else if (this.characterType === 'rockGiant') {
                    this.createRockShield();
                } else if (this.characterType === 'shadowAssassin') {
                    this.createInvisibility();
                }
                break;
                
            case 'ultimate':
                if (this.characterType === 'fireWarrior') {
                    this.createFireDragon();
                } else if (this.characterType === 'thunderMage') {
                    this.createThunderStorm();
                } else if (this.characterType === 'iceKnight') {
                    this.createFreezeField();
                } else if (this.characterType === 'windNinja') {
                    this.createWindSlash();
                } else if (this.characterType === 'rockGiant') {
                    this.createEarthquake();
                } else if (this.characterType === 'shadowAssassin') {
                    this.createShadowStrike();
                }
                break;
                
            case 'super':
                if (this.characterType === 'fireWarrior') {
                    this.createPhoenixRising();
                } else if (this.characterType === 'thunderMage') {
                    this.createThunderGod();
                } else if (this.characterType === 'iceKnight') {
                    this.createAbsoluteZero();
                } else if (this.characterType === 'windNinja') {
                    this.createWindGod();
                } else if (this.characterType === 'rockGiant') {
                    this.createMountainCrush();
                } else if (this.characterType === 'shadowAssassin') {
                    this.createShadowStorm();
                }
                break;
        }
    }
    
    updatePhysics(deltaTime) {
        this.vy += 800 * (deltaTime / 1000);
        
        this.x += this.vx * (deltaTime / 1000);
        this.y += this.vy * (deltaTime / 1000);
        
        const groundY = 400;
        if (this.y >= groundY) {
            this.y = groundY;
            this.vy = 0;
            this.onGround = true;
            
            if (this.state === 'jump') {
                this.state = 'idle';
            }
        } else {
            this.onGround = false;
        }
        
        if (this.x < 0) this.x = 0;
        if (this.x > 1150) this.x = 1150;
    }
    
    updateAnimations(deltaTime) {
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame++;
            this.animationTimer = 0;
        }
        
        if (this.animationFrame >= 8) {
            this.animationFrame = 0;
        }
    }
    
    updateAttack(deltaTime) {
        if (this.state === 'attack' && this.currentAttack) {
            this.attackTimer += deltaTime;
            
            const attack = this.attackData[this.currentAttack];
            const totalTime = attack.windup + attack.active + attack.recovery;
            
            if (this.attackTimer >= totalTime) {
                this.state = 'idle';
                this.currentAttack = null;
                this.attackTimer = 0;
                this.hasHit = false;
            }
        }
    }
    
    updateSpecialEffects(deltaTime) {
        this.specialEffects = this.specialEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isFinished();
        });
    }
    
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerableTimer -= deltaTime;
            if (this.invulnerableTimer <= 0) {
                this.invulnerable = false;
                this.invulnerableTimer = 0;
            }
        }
    }
    
    updateCombo(deltaTime) {
        if (this.comboCount > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
                this.comboTimer = 0;
            }
        }
    }
    
    takeDamage(damage, knockback = 0, direction = 0) {
        if (this.invulnerable) return;
        
        const actualDamage = Math.max(1, Math.floor(damage * (1 - this.defense * 0.1)));
        this.hp -= actualDamage;
        
        if (this.hp < 0) this.hp = 0;
        
        if (knockback > 0) {
            this.vx = direction * knockback;
            this.vy = -100;
            this.state = 'hitstun';
        }
        
        this.comboCount++;
        this.comboTimer = this.maxComboTime;
        
        this.invulnerable = true;
        this.invulnerableTimer = 1000;
    }
    
    isAttacking() {
        return this.state === 'attack';
    }
    
    canHit() {
        return this.isAttacking() && !this.hasHit && this.currentAttack;
    }
    
    getCurrentAttackDamage() {
        if (!this.currentAttack) return 0;
        return this.attackData[this.currentAttack].damage * this.attack;
    }
    
    markAsHit() {
        this.hasHit = true;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.hp = this.maxHp;
        this.energy = 0;
        this.state = 'idle';
        this.currentAttack = null;
        this.attackTimer = 0;
        this.hasHit = false;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.specialEffects = [];
    }
    
    render(ctx) {
        ctx.save();
        
        if (this.invulnerable && Math.floor(this.animationFrame) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (!this.isFacingRight) {
            ctx.scale(-1, 1);
            ctx.translate(-this.x - this.width, 0);
        } else {
            ctx.translate(this.x, 0);
        }
        
        this.renderCharacter(ctx);
        this.renderSpecialEffects(ctx);
        
        ctx.restore();
    }
    
    renderCharacter(ctx) {
        const characterColor = this.baseStats.color;
        const skinColor = '#FFDBAC';
        const shadowColor = 'rgba(0, 0, 0, 0.3)';
        
        // 保存坐标系并翻转（因为角色可能面向不同方向）
        ctx.save();
        if (!this.isFacingRight) {
            ctx.translate(this.x + this.width, this.y - this.height);
            ctx.scale(-1, 1);
        } else {
            ctx.translate(this.x, this.y - this.height);
        }
        
        // 渲染阴影
        ctx.fillStyle = shadowColor;
        ctx.fillRect(0, this.height - 5, this.width, 5);
        
        // 角色身体部位渲染
        this.renderHead(ctx, characterColor, skinColor);
        this.renderTorso(ctx, characterColor, skinColor);
        this.renderArms(ctx, characterColor, skinColor);
        this.renderLegs(ctx, characterColor, skinColor);
        this.renderCharacterDetails(ctx, characterColor, skinColor);
        
        ctx.restore();
        
        this.renderAttackRange(ctx);
    }
    
    renderHead(ctx, characterColor, skinColor) {
        // 头部（圆形）
        const headY = this.height - 80;
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(25, headY, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 头发
        ctx.fillStyle = this.getHairColor(characterColor);
        ctx.beginPath();
        ctx.arc(25, headY - 8, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(20, headY - 2, 2, 0, Math.PI * 2);
        ctx.arc(30, headY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 嘴巴
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (this.state === 'hitstun') {
            // 痛苦表情
            ctx.moveTo(20, headY + 5);
            ctx.lineTo(25, headY + 8);
            ctx.lineTo(30, headY + 5);
        } else if (this.state === 'attack') {
            // 攻击表情
            ctx.moveTo(20, headY + 4);
            ctx.lineTo(30, headY + 4);
        } else {
            // 正常表情
            ctx.arc(25, headY + 5, 3, 0, Math.PI);
        }
        ctx.stroke();
    }
    
    renderTorso(ctx, characterColor, skinColor) {
        // 身体
        ctx.fillStyle = this.getOutfitColor(characterColor);
        ctx.fillRect(15, this.height - 65, 20, 25);
        
        // 手臂连接
        ctx.fillStyle = skinColor;
        ctx.fillRect(12, this.height - 60, 6, 15);
        ctx.fillRect(32, this.height - 60, 6, 15);
        
        // 角色类型标识
        if (this.characterType === 'fireWarrior') {
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(18, this.height - 55, 4, 4);
            ctx.fillRect(28, this.height - 55, 4, 4);
        } else if (this.characterType === 'thunderMage') {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(25, this.height - 60);
            ctx.lineTo(22, this.height - 50);
            ctx.lineTo(25, this.height - 55);
            ctx.lineTo(28, this.height - 50);
            ctx.lineTo(25, this.height - 60);
            ctx.fill();
        }
    }
    
    renderArms(ctx, characterColor, skinColor) {
        const armY = this.height - 45;
        const armOffset = this.state === 'attack' ? 8 : 0;
        
        // 左臂
        ctx.fillStyle = skinColor;
        ctx.fillRect(8, armY, 8, 20);
        
        // 右臂（根据状态调整位置）
        ctx.fillRect(34, armY - armOffset, 8, 20);
        
        // 手套或武器
        if (this.state === 'attack') {
            ctx.fillStyle = this.getWeaponColor(characterColor);
            ctx.fillRect(36, armY - armOffset + 15, 10, 8);
        } else {
            ctx.fillStyle = skinColor;
            ctx.fillRect(36, armY + 15, 6, 6);
        }
    }
    
    renderLegs(ctx, characterColor, skinColor) {
        const legY = this.height - 40;
        
        // 左腿
        ctx.fillStyle = this.getPantsColor(characterColor);
        ctx.fillRect(18, legY, 6, 25);
        
        // 右腿
        ctx.fillRect(26, legY, 6, 25);
        
        // 鞋子
        ctx.fillStyle = '#333';
        ctx.fillRect(16, legY + 20, 10, 8);
        ctx.fillRect(24, legY + 20, 10, 8);
    }
    
    renderCharacterDetails(ctx, characterColor, skinColor) {
        // 根据角色类型添加特殊细节
        if (this.characterType === 'iceKnight') {
            // 冰霜效果
            ctx.fillStyle = 'rgba(173, 216, 230, 0.7)';
            ctx.fillRect(12, this.height - 65, 26, 25);
        } else if (this.characterType === 'windNinja') {
            // 忍者带
            ctx.fillStyle = '#444';
            ctx.fillRect(15, this.height - 45, 20, 4);
        } else if (this.characterType === 'shadowAssassin') {
            // 暗影效果
            ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
            ctx.beginPath();
            ctx.arc(25, this.height - 40, 20, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 伤害指示器
        if (this.invulnerable) {
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.strokeRect(-2, this.height - this.height - 2, this.width + 4, this.height + 4);
            ctx.setLineDash([]);
        }
    }
    
    getHairColor(characterColor) {
        const colorMap = {
            '#ff4444': '#8B0000', // 火焰战士 - 深红色头发
            '#ffaa00': '#FFD700', // 雷电法师 - 金色头发
            '#00aaff': '#C0C0C0', // 冰霜骑士 - 银色头发
            '#88ff88': '#006400', // 风忍 - 深绿色头发
            '#8B4513': '#2F4F4F', // 岩石巨人 - 深灰色头发
            '#4B0082': '#000000'  // 暗影刺客 - 黑色头发
        };
        return colorMap[characterColor] || '#8B4513';
    }
    
    getOutfitColor(characterColor) {
        const colorMap = {
            '#ff4444': '#8B0000', // 火焰战士 - 深红色衣服
            '#ffaa00': '#FFA500', // 雷电法师 - 橙色衣服
            '#00aaff': '#4169E1', // 冰霜骑士 - 蓝色衣服
            '#88ff88': '#228B22', // 风忍 - 绿色衣服
            '#8B4513': '#A0522D', // 岩石巨人 - 棕色衣服
            '#4B0082': '#2F2F2F'  // 暗影刺客 - 灰色衣服
        };
        return colorMap[characterColor] || '#8B4513';
    }
    
    getPantsColor(characterColor) {
        const colorMap = {
            '#ff4444': '#4B0000', // 火焰战士 - 深红色裤子
            '#ffaa00': '#FF8C00', // 雷电法师 - 深橙色裤子
            '#00aaff': '#191970', // 冰霜骑士 - 深蓝色裤子
            '#88ff88': '#006400', // 风忍 - 深绿色裤子
            '#8B4513': '#654321', // 岩石巨人 - 深棕色裤子
            '#4B0082': '#1C1C1C'  // 暗影刺客 - 深灰色裤子
        };
        return colorMap[characterColor] || '#654321';
    }
    
    getWeaponColor(characterColor) {
        const colorMap = {
            '#ff4444': '#FF4500', // 火焰战士 - 橙红色武器
            '#ffaa00': '#FFFF00', // 雷电法师 - 黄色武器
            '#00aaff': '#87CEEB', // 冰霜骑士 - 天蓝色武器
            '#88ff88': '#ADFF2F', // 风忍 - 绿黄色武器
            '#8B4513': '#CD853F', // 岩石巨人 - 秘鲁色武器
            '#4B0082': '#9370DB'  // 暗影刺客 - 紫色武器
        };
        return colorMap[characterColor] || '#FF4500';
    }
    
    renderAttackRange(ctx) {
        if (this.isAttacking() && this.currentAttack) {
            const attack = this.attackData[this.currentAttack];
            const range = attack.range;
            
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            if (this.isFacingRight) {
                ctx.strokeRect(this.width, this.y - this.height, range, this.height);
            } else {
                ctx.strokeRect(-range, this.y - this.height, range, this.height);
            }
            
            ctx.setLineDash([]);
        }
    }
    
    renderSpecialEffects(ctx) {
        this.specialEffects.forEach(effect => effect.render(ctx));
    }
    
    createFireball() {
        this.specialEffects.push(new FireballEffect(this.x + this.width, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('fireball');
    }
    
    createLightningChain() {
        this.specialEffects.push(new LightningChainEffect(this.x + this.width, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('lightning');
    }
    
    createIceWall() {
        this.specialEffects.push(new IceWallEffect(this.x + this.width, this.y - this.height, this.isFacingRight));
        this.playSpecialSound('ice');
    }
    
    createTornado() {
        this.specialEffects.push(new TornadoEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('wind');
    }
    
    createRockShield() {
        this.specialEffects.push(new RockShieldEffect(this.x, this.y - this.height));
        this.playSpecialSound('rock');
    }
    
    createInvisibility() {
        this.invulnerable = true;
        this.invulnerableTimer = 3000;
        this.specialEffects.push(new InvisibilityEffect(this.x, this.y - this.height, this.width, this.height));
        this.playSpecialSound('shadow');
    }
    
    createFireDragon() {
        this.specialEffects.push(new FireDragonEffect(this.x + this.width, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('fireball');
    }
    
    createThunderStorm() {
        this.specialEffects.push(new ThunderStormEffect(this.x + this.width / 2, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('lightning');
    }
    
    createFreezeField() {
        this.specialEffects.push(new FreezeFieldEffect(this.x + this.width / 2, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('ice');
    }
    
    createWindSlash() {
        this.specialEffects.push(new WindSlashEffect(this.x + this.width / 2, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('wind');
    }
    
    createEarthquake() {
        this.specialEffects.push(new EarthquakeEffect(this.x + this.width / 2, this.y));
        this.playSpecialSound('rock');
    }
    
    createShadowStrike() {
        this.specialEffects.push(new ShadowStrikeEffect(this.x + this.width, this.y - this.height / 2, this.isFacingRight));
        this.playSpecialSound('shadow');
    }
    
    createPhoenixRising() {
        this.specialEffects.push(new PhoenixRisingEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('fireball');
    }
    
    createThunderGod() {
        this.specialEffects.push(new ThunderGodEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('lightning');
    }
    
    createAbsoluteZero() {
        this.specialEffects.push(new AbsoluteZeroEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('ice');
    }
    
    createWindGod() {
        this.specialEffects.push(new WindGodEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('wind');
    }
    
    createMountainCrush() {
        this.specialEffects.push(new MountainCrushEffect(this.x + this.width / 2, this.y - this.height));
        this.playSpecialSound('rock');
    }
    
    createShadowStorm() {
        this.specialEffects.push(new ShadowStormEffect(this.x + this.width / 2, this.y - this.height / 2));
        this.playSpecialSound('shadow');
    }
    
    playSpecialSound(abilityType) {
        if (window.game && window.game.audioSystem) {
            window.game.audioSystem.playSound(abilityType);
        }
    }
}