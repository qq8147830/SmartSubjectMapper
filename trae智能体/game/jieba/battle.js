class BattleSystem {
    constructor() {
        this.hitEffects = [];
        this.blockEffects = [];
        this.comboEffects = [];
    }
    
    checkHit(attacker, defender, attackData) {
        if (!this.isAttackActive(attacker)) return false;
        
        const hitbox = this.getHitbox(attacker, attackData);
        const hurtbox = this.getHurtbox(defender);
        
        return this.checkCollision(hitbox, hurtbox);
    }
    
    isAttackActive(attacker) {
        return attacker.state === 'attack' && attacker.currentAttack;
    }
    
    getHitbox(attacker, attackData) {
        const hitbox = {
            x: attacker.x,
            y: attacker.y - attacker.height,
            width: attackData.range,
            height: attacker.height
        };
        
        if (!attacker.isFacingRight) {
            hitbox.x = attacker.x - attackData.range;
        }
        
        return hitbox;
    }
    
    getHurtbox(defender) {
        return {
            x: defender.x,
            y: defender.y - defender.height,
            width: defender.width,
            height: defender.height
        };
    }
    
    checkCollision(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
    }
    
    calculateDamage(attacker, defender, attackType) {
        const baseDamage = attacker.attackData[attackType].damage;
        const comboBonus = Math.min(attacker.comboCount * 0.1, 2.0);
        const damage = Math.floor(baseDamage * attacker.attack * (1 + comboBonus));
        
        const actualDamage = Math.max(1, Math.floor(damage * (1 - defender.defense * 0.1)));
        
        return actualDamage;
    }
    
    applyHit(attacker, defender, attackType) {
        const attackData = attacker.attackData[attackType];
        const damage = this.calculateDamage(attacker, defender, attackType);
        
        const direction = attacker.isFacingRight ? 1 : -1;
        
        defender.takeDamage(damage, attackData.knockback, direction);
        
        this.createHitEffect(defender.x + defender.width / 2, defender.y - defender.height / 2, damage);
        
        return damage;
    }
    
    createHitEffect(x, y, damage) {
        this.hitEffects.push(new HitEffect(x, y, damage));
    }
    
    createBlockEffect(x, y) {
        this.blockEffects.push(new BlockEffect(x, y));
    }
    
    createComboEffect(x, y, comboCount) {
        this.comboEffects.push(new ComboEffect(x, y, comboCount));
    }
    
    update(deltaTime) {
        this.updateHitEffects(deltaTime);
        this.updateBlockEffects(deltaTime);
        this.updateComboEffects(deltaTime);
    }
    
    updateHitEffects(deltaTime) {
        this.hitEffects = this.hitEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isFinished();
        });
    }
    
    updateBlockEffects(deltaTime) {
        this.blockEffects = this.blockEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isFinished();
        });
    }
    
    updateComboEffects(deltaTime) {
        this.comboEffects = this.comboEffects.filter(effect => {
            effect.update(deltaTime);
            return !effect.isFinished();
        });
    }
    
    render(ctx) {
        this.hitEffects.forEach(effect => effect.render(ctx));
        this.blockEffects.forEach(effect => effect.render(ctx));
        this.comboEffects.forEach(effect => effect.render(ctx));
    }
    
    checkProjectileHit(projectile, defender) {
        const projectileBox = {
            x: projectile.x - 10,
            y: projectile.y - 10,
            width: 20,
            height: 20
        };
        
        const hurtbox = this.getHurtbox(defender);
        
        return this.checkCollision(projectileBox, hurtbox);
    }
    
    processProjectileHit(projectile, defender) {
        if (defender.invulnerable) return false;
        
        const damage = projectile.damage;
        const direction = projectile.direction;
        
        defender.takeDamage(damage, 100, direction);
        
        this.createHitEffect(projectile.x, projectile.y, damage);
        
        return true;
    }
    
    render(ctx) {
        this.hitEffects.forEach(effect => effect.render(ctx));
        this.blockEffects.forEach(effect => effect.render(ctx));
        this.comboEffects.forEach(effect => effect.render(ctx));
        
        this.hitEffects = this.hitEffects.filter(effect => effect.lifetime > 0);
        this.blockEffects = this.blockEffects.filter(effect => effect.lifetime > 0);
        this.comboEffects = this.comboEffects.filter(effect => effect.lifetime > 0);
    }
}

class BlockEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 500;
        this.maxLifetime = 500;
        this.size = 40;
        this.color = '#00ffff';
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.size += deltaTime * 0.02;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLOCK', this.x, this.y + 5);
        
        ctx.restore();
    }
}

class ComboEffect {
    constructor(x, y, comboCount) {
        this.x = x;
        this.y = y;
        this.comboCount = comboCount;
        this.lifetime = 1500;
        this.maxLifetime = 1500;
        this.size = 1;
        this.color = '#ff6600';
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.size += deltaTime * 0.003;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.color;
        ctx.font = `bold ${Math.min(48, 24 + this.size)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`COMBO x${this.comboCount}`, this.x, this.y - this.size);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeText(`COMBO x${this.comboCount}`, this.x, this.y - this.size);
        
        ctx.restore();
    }
}
