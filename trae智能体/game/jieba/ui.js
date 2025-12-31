class UISystem {
    constructor(game) {
        this.game = game;
        this.animations = [];
        this.notifications = [];
    }
    
    update(deltaTime) {
        this.updateAnimations(deltaTime);
        this.updateNotifications(deltaTime);
        this.updateHealthBars(deltaTime);
        this.updateEnergyBars(deltaTime);
        this.updateComboDisplay(deltaTime);
        this.updateTimerDisplay(deltaTime);
    }
    
    updateAnimations(deltaTime) {
        this.animations = this.animations.filter(anim => {
            anim.update(deltaTime);
            return !anim.isFinished();
        });
    }
    
    updateNotifications(deltaTime) {
        this.notifications = this.notifications.filter(notification => {
            notification.update(deltaTime);
            return !notification.isFinished();
        });
    }
    
    updateHealthBars(deltaTime) {
        const playerAHealthBar = document.getElementById('playerAHealth');
        const playerBHealthBar = document.getElementById('playerBHealth');
        
        if (playerAHealthBar && this.game.playerA) {
            const healthPercent = (this.game.playerA.hp / this.game.playerA.maxHp) * 100;
            const targetWidth = Math.max(0, healthPercent);
            
            this.animateBarWidth(playerAHealthBar, targetWidth, deltaTime);
            
            this.updateHealthBarColor(playerAHealthBar, healthPercent);
        }
        
        if (playerBHealthBar && this.game.playerB) {
            const healthPercent = (this.game.playerB.hp / this.game.playerB.maxHp) * 100;
            const targetWidth = Math.max(0, healthPercent);
            
            this.animateBarWidth(playerBHealthBar, targetWidth, deltaTime);
            
            this.updateHealthBarColor(playerBHealthBar, healthPercent);
        }
    }
    
    animateBarWidth(element, targetWidth, deltaTime) {
        const currentWidth = parseFloat(element.style.width) || 0;
        const difference = targetWidth - currentWidth;
        const animationSpeed = 0.5;
        
        if (Math.abs(difference) > 0.1) {
            element.style.width = currentWidth + difference * animationSpeed + '%';
        } else {
            element.style.width = targetWidth + '%';
        }
    }
    
    updateHealthBarColor(element, healthPercent) {
        if (healthPercent > 50) {
            element.style.background = 'linear-gradient(90deg, #00ff00, #88ff00)';
        } else if (healthPercent > 25) {
            element.style.background = 'linear-gradient(90deg, #ffff00, #ff8800)';
        } else {
            element.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
        }
    }
    
    updateEnergyBars(deltaTime) {
        const playerAEnergyBar = document.getElementById('playerAEnergy');
        const playerBEnergyBar = document.getElementById('playerBEnergy');
        
        if (playerAEnergyBar && this.game.playerA) {
            const energyPercent = (this.game.playerA.energy / this.game.playerA.maxEnergy) * 100;
            this.animateEnergyBar(playerAEnergyBar, energyPercent, deltaTime);
        }
        
        if (playerBEnergyBar && this.game.playerB) {
            const energyPercent = (this.game.playerB.energy / this.game.playerB.maxEnergy) * 100;
            this.animateEnergyBar(playerBEnergyBar, energyPercent, deltaTime);
        }
    }
    
    animateEnergyBar(element, targetPercent, deltaTime) {
        const currentPercent = parseFloat(element.style.width) || 0;
        const difference = targetPercent - currentPercent;
        const animationSpeed = 0.3;
        
        if (Math.abs(difference) > 0.1) {
            element.style.width = currentPercent + difference * animationSpeed + '%';
        } else {
            element.style.width = targetPercent + '%';
        }
    }
    
    updateComboDisplay(deltaTime) {
        const comboCounter = document.getElementById('comboCounter');
        if (comboCounter) {
            if (this.game.comboSystem.currentCombo > 0) {
                comboCounter.textContent = `COMBO x${this.game.comboSystem.currentCombo}`;
                comboCounter.style.display = 'block';
                
                const timeLeft = this.game.comboSystem.comboTimer;
                const maxTime = this.game.comboSystem.maxComboTime;
                const alpha = Math.max(0.3, timeLeft / maxTime);
                
                comboCounter.style.opacity = alpha;
                
                if (timeLeft < 1000) {
                    comboCounter.style.transform = `scale(${1 + (1000 - timeLeft) * 0.001})`;
                } else {
                    comboCounter.style.transform = 'scale(1)';
                }
            } else {
                comboCounter.style.display = 'none';
            }
        }
    }
    
    updateTimerDisplay(deltaTime) {
        const timer = document.getElementById('gameTimer');
        if (timer && this.game.roundActive) {
            const timeLeft = Math.ceil(this.game.roundTimer);
            timer.textContent = timeLeft;
            
            if (timeLeft <= 10) {
                timer.style.color = '#ff0000';
                timer.style.animation = 'pulse 1s infinite';
            } else if (timeLeft <= 30) {
                timer.style.color = '#ffaa00';
            } else {
                timer.style.color = '#ffffff';
                timer.style.animation = 'none';
            }
        }
    }
    
    showNotification(message, type = 'info', duration = 2000) {
        this.notifications.push(new Notification(message, type, duration));
        
        this.playUISound(type);
    }
    
    playUISound(type) {
        if (this.game && this.game.audioSystem) {
            let soundName = 'hit';
            
            switch (type) {
                case 'victory':
                    soundName = 'victory';
                    break;
                case 'draw':
                    soundName = 'gameOver';
                    break;
                case 'round':
                    soundName = 'jump';
                    break;
                case 'info':
                    soundName = 'combo';
                    break;
                default:
                    soundName = 'hit';
            }
            
            this.game.audioSystem.playSound(soundName);
        }
    }
    
    showRoundStart(roundNumber) {
        this.showNotification(`第 ${roundNumber} 回合`, 'round', 1500);
    }
    
    showRoundEnd(winner) {
        if (winner === 'draw') {
            this.showNotification('平局！', 'draw', 3000);
        } else {
            this.showNotification(`${winner} 获胜！`, 'victory', 3000);
        }
    }
    
    createHealthBarAnimation(player, type = 'damage') {
        const element = player.name === 'playerA' ? 
            document.getElementById('playerAHealth') : 
            document.getElementById('playerBHealth');
        
        if (element) {
            this.animations.push(new HealthBarAnimation(element, type));
        }
    }
    
    createComboAnimation(comboCount) {
        const comboCounter = document.getElementById('comboCounter');
        if (comboCounter && comboCount > 0) {
            this.animations.push(new ComboAnimation(comboCounter, comboCount));
        }
    }
    
    createEnergyAnimation(player, amount) {
        const element = player.name === 'playerA' ? 
            document.getElementById('playerAEnergy') : 
            document.getElementById('playerBEnergy');
        
        if (element) {
            this.animations.push(new EnergyAnimation(element, amount));
        }
    }
    
    render(ctx) {
        this.animations.forEach(animation => animation.render(ctx));
        this.notifications.forEach(notification => notification.render(ctx));
    }
}

class Notification {
    constructor(message, type, duration) {
        this.message = message;
        this.type = type;
        this.duration = duration;
        this.maxDuration = duration;
        this.x = 600;
        this.y = 100;
        this.alpha = 0;
        this.scale = 0.5;
    }
    
    update(deltaTime) {
        this.duration -= deltaTime;
        
        if (this.duration > this.maxDuration * 0.8) {
            this.alpha = (this.maxDuration * 0.8 - (this.maxDuration * 0.8 - this.duration)) / (this.maxDuration * 0.8);
            this.scale = 0.5 + (this.alpha * 0.5);
        } else if (this.duration < 500) {
            this.alpha = this.duration / 500;
            this.scale = this.alpha;
        } else {
            this.alpha = 1;
            this.scale = 1;
        }
    }
    
    isFinished() {
        return this.duration <= 0;
    }
    
    render(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        let bgColor, textColor, borderColor;
        
        switch (this.type) {
            case 'victory':
                bgColor = 'rgba(255, 215, 0, 0.9)';
                textColor = '#000000';
                borderColor = '#FFD700';
                break;
            case 'draw':
                bgColor = 'rgba(128, 128, 128, 0.9)';
                textColor = '#ffffff';
                borderColor = '#808080';
                break;
            case 'round':
                bgColor = 'rgba(0, 100, 255, 0.9)';
                textColor = '#ffffff';
                borderColor = '#0064FF';
                break;
            default:
                bgColor = 'rgba(0, 0, 0, 0.8)';
                textColor = '#ffffff';
                borderColor = '#666666';
        }
        
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        
        const padding = 20;
        const textMetrics = ctx.measureText(this.message);
        const width = textMetrics.width + padding * 2;
        const height = 50;
        
        ctx.beginPath();
        ctx.roundRect(-width/2, -height/2, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = textColor;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.message, 0, 0);
        
        ctx.restore();
    }
}

class HealthBarAnimation {
    constructor(element, type) {
        this.element = element;
        this.type = type;
        this.duration = 1000;
        this.maxDuration = 1000;
        this.shakeIntensity = 5;
        this.soundPlayed = false;
        
        this.playHealthBarSound();
    }
    
    playHealthBarSound() {
        if (window.game && window.game.audioSystem && !this.soundPlayed) {
            this.soundPlayed = true;
            
            if (this.type === 'damage') {
                window.game.audioSystem.playSound('block');
            } else if (this.type === 'heal') {
                window.game.audioSystem.playSound('jump');
            }
        }
    }
    
    update(deltaTime) {
        this.duration -= deltaTime;
        
        if (this.type === 'damage') {
            const shake = Math.sin((this.maxDuration - this.duration) * 0.05) * this.shakeIntensity;
            this.element.style.transform = `translateX(${shake}px)`;
        }
    }
    
    isFinished() {
        if (this.duration <= 0) {
            this.element.style.transform = 'translateX(0px)';
            return true;
        }
        return false;
    }
    
    render(ctx) {
    }
}

class ComboAnimation {
    constructor(element, comboCount) {
        this.element = element;
        this.comboCount = comboCount;
        this.duration = 1500;
        this.maxDuration = 1500;
        this.scale = 1;
    }
    
    update(deltaTime) {
        this.duration -= deltaTime;
        
        const progress = 1 - (this.duration / this.maxDuration);
        
        if (progress < 0.2) {
            this.scale = 1 + progress * 2;
        } else if (progress > 0.8) {
            this.scale = 1 + (1 - progress) * 0.5;
        } else {
            this.scale = 2;
        }
        
        this.element.style.transform = `scale(${this.scale})`;
    }
    
    isFinished() {
        if (this.duration <= 0) {
            this.element.style.transform = 'scale(1)';
            return true;
        }
        return false;
    }
    
    render(ctx) {
    }
}

class EnergyAnimation {
    constructor(element, amount) {
        this.element = element;
        this.amount = amount;
        this.duration = 800;
        this.maxDuration = 800;
        this.particles = [];
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: Math.random() * 200,
                y: Math.random() * 20,
                vx: (Math.random() - 0.5) * 100,
                vy: -50 - Math.random() * 50,
                life: this.duration,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    update(deltaTime) {
        this.duration -= deltaTime;
        
        this.particles.forEach(particle => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= deltaTime;
        });
    }
    
    isFinished() {
        return this.duration <= 0;
    }
    
    render(ctx) {
        const canvas = ctx.canvas;
        const rect = this.element.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        
        this.particles.forEach(particle => {
            if (particle.life > 0) {
                const alpha = particle.life / this.maxDuration;
                ctx.save();
                ctx.globalAlpha = alpha;
                
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(x + particle.x, y + particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        });
    }
}

CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    
    this.beginPath();
    this.moveTo(x + radius.tl, y);
    this.lineTo(x + width - radius.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.lineTo(x + width, y + height - radius.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    this.lineTo(x + radius.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.lineTo(x, y + radius.tl);
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    this.closePath();
    
    return this;
};