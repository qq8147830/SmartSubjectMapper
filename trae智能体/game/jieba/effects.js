class Projectile {
    constructor(owner, x, y, direction, damage, type) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.damage = damage;
        this.type = type;
        
        this.speed = 400;
        this.radius = 10;
        this.lifetime = 3000;
        this.maxLifetime = 3000;
        
        this.finished = false;
    }
    
    update(deltaTime) {
        this.x += this.direction * this.speed * (deltaTime / 1000);
        this.lifetime -= deltaTime;
        
        if (this.lifetime <= 0) {
            this.finished = true;
        }
    }
    
    isFinished() {
        return this.finished;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        switch (this.type) {
            case 'fireball':
                this.renderFireball(ctx);
                break;
            case 'lightning':
                this.renderLightning(ctx);
                break;
            case 'iceShard':
                this.renderIceShard(ctx);
                break;
            case 'wind':
                this.renderWind(ctx);
                break;
        }
        
        ctx.restore();
    }
    
    renderFireball(ctx) {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ff0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    renderLightning(ctx) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y);
        ctx.lineTo(this.x + 10, this.y);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    renderIceShard(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.strokeStyle = '#0088ff';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x - this.radius * 0.5, this.y + this.radius);
        ctx.lineTo(this.x + this.radius * 0.5, this.y + this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    renderWind(ctx) {
        ctx.strokeStyle = '#88ff88';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }
}

class HitEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 600;
        this.maxLifetime = 600;
        this.particles = [];
        
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: this.lifetime,
                maxLife: this.lifetime
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.particles.forEach(particle => {
            particle.x += particle.vx * (deltaTime / 1000);
            particle.y += particle.vy * (deltaTime / 1000);
            particle.life -= deltaTime;
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        this.particles.forEach(particle => {
            const particleAlpha = particle.life / particle.maxLife;
            ctx.globalAlpha = alpha * particleAlpha;
            
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

class FireballEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 2000;
        this.maxLifetime = 2000;
        this.trail = [];
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.trail.push({ x: this.x, y: this.y, life: this.maxLifetime });
        
        this.trail = this.trail.filter(point => {
            point.life -= deltaTime;
            return point.life > 0;
        });
        
        if (this.direction > 0) {
            this.x += 300 * (deltaTime / 1000);
        } else {
            this.x -= 300 * (deltaTime / 1000);
        }
    }
    
    isFinished() {
        return this.lifetime <= 0 || this.x < 0 || this.x > 1200;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        this.trail.forEach(point => {
            const pointAlpha = point.life / this.maxLifetime;
            ctx.globalAlpha = alpha * pointAlpha;
            
            const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 15);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.7, '#ff6600');
            gradient.addColorStop(1, '#ff0000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 15 * (point.life / this.maxLifetime), 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}

class LightningChainEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 1000;
        this.maxLifetime = 1000;
        this.bolts = [];
        
        for (let i = 0; i < 5; i++) {
            this.bolts.push({
                x: x + (direction * i * 60),
                y: y + Math.sin(i * 2) * 20,
                intensity: 1 - (i * 0.2)
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.bolts.forEach((bolt, index) => {
            bolt.x += this.direction * 20 * (deltaTime / 1000);
            bolt.y += Math.sin(Date.now() * 0.01 + index) * 2;
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;
        
        this.bolts.forEach((bolt, index) => {
            if (index < this.bolts.length - 1) {
                ctx.beginPath();
                ctx.moveTo(bolt.x, bolt.y);
                ctx.lineTo(this.bolts[index + 1].x, this.bolts[index + 1].y);
                ctx.stroke();
            }
        });
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class IceWallEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 3000;
        this.maxLifetime = 3000;
        this.height = 80;
        this.width = 20;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
        gradient.addColorStop(0, '#e0f6ff');
        gradient.addColorStop(0.5, '#b8e6ff');
        gradient.addColorStop(1, '#90d4ff');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        for (let i = 0; i < this.height; i += 10) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class TornadoEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 2000;
        this.maxLifetime = 2000;
        this.radius = 30;
        this.rotation = 0;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.rotation += deltaTime * 0.01;
        this.radius += Math.sin(Date.now() * 0.005) * 2;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.radius + i * 5;
            
            ctx.strokeStyle = `hsl(${120 + i * 10}, 70%, 60%)`;
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            ctx.arc(0, 0, radius, angle, angle + Math.PI / 4);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class RockShieldEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 4000;
        this.maxLifetime = 4000;
        this.rotation = 0;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.rotation += deltaTime * 0.002;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x + 25, this.y + 50);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#8B4513';
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(-30, -30);
        ctx.lineTo(0, -40);
        ctx.lineTo(30, -30);
        ctx.lineTo(40, 0);
        ctx.lineTo(30, 30);
        ctx.lineTo(0, 40);
        ctx.lineTo(-30, 30);
        ctx.lineTo(-40, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
}

class InvisibilityEffect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.lifetime = 3000;
        this.maxLifetime = 3000;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime * 0.3;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.setLineDash([]);
        ctx.restore();
    }
}

class FireDragonEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 1500;
        this.maxLifetime = 1500;
        this.headX = x;
        this.headY = y;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.headX += this.direction * 200 * (deltaTime / 1000);
        this.headY += Math.sin(Date.now() * 0.01) * 50 * (deltaTime / 1000);
    }
    
    isFinished() {
        return this.lifetime <= 0 || this.headX < 0 || this.headX > 1200;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createLinearGradient(this.x, this.y, this.headX, this.headY);
        gradient.addColorStop(0, '#ff4400');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, '#ffff00');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.headX, this.headY);
        ctx.stroke();
        
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.headX, this.headY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.headX + this.direction * 15, this.headY - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

class ThunderStormEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 2000;
        this.maxLifetime = 2000;
        this.bolts = [];
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createLightningBolt(x + this.direction * i * 80, y - 100, y + 50);
            }, i * 200);
        }
    }
    
    createLightningBolt(startX, startY, endY) {
        const segments = [];
        let currentX = startX;
        let currentY = startY;
        
        while (currentY < endY) {
            segments.push({ x: currentX, y: currentY });
            currentX += (Math.random() - 0.5) * 40;
            currentY += 20 + Math.random() * 20;
        }
        
        segments.push({ x: currentX, y: endY });
        this.bolts.push({ segments, life: this.maxLifetime });
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.bolts.forEach(bolt => {
            bolt.life -= deltaTime;
        });
        
        this.bolts = this.bolts.filter(bolt => bolt.life > 0);
    }
    
    isFinished() {
        return this.lifetime <= 0 && this.bolts.length === 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        
        this.bolts.forEach(bolt => {
            const boltAlpha = bolt.life / this.maxLifetime;
            ctx.globalAlpha = alpha * boltAlpha;
            
            ctx.beginPath();
            ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
            
            bolt.segments.forEach(segment => {
                ctx.lineTo(segment.x, segment.y);
            });
            
            ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class FreezeFieldEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 3000;
        this.maxLifetime = 3000;
        this.radius = 100;
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.radius += Math.sin(Date.now() * 0.005) * 5;
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(200, 255, 255, 0.8)');
        gradient.addColorStop(0.7, 'rgba(150, 220, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 180, 255, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const startX = this.x + Math.cos(angle) * (this.radius - 10);
            const startY = this.y + Math.sin(angle) * (this.radius - 10);
            const endX = this.x + Math.cos(angle) * (this.radius + 10);
            const endY = this.y + Math.sin(angle) * (this.radius + 10);
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

class WindSlashEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 1000;
        this.maxLifetime = 1000;
        this.slashes = [];
        
        for (let i = 0; i < 3; i++) {
            this.slashes.push({
                offset: i * 50,
                alpha: 1 - (i * 0.3)
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.slashes.forEach(slash => {
            slash.offset += this.direction * 300 * (deltaTime / 1000);
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.slashes.forEach(slash => {
            ctx.globalAlpha = alpha * slash.alpha;
            
            ctx.strokeStyle = '#88ff88';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            
            const startX = this.x + slash.offset;
            const endX = startX + this.direction * 80;
            
            ctx.beginPath();
            ctx.moveTo(startX, this.y - 30);
            ctx.lineTo(endX, this.y + 30);
            ctx.stroke();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(startX, this.y - 25);
            ctx.lineTo(endX, this.y + 25);
            ctx.stroke();
        });
        
        ctx.restore();
    }
}

class EarthquakeEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 2000;
        this.maxLifetime = 2000;
        this.waves = [];
        
        for (let i = 0; i < 5; i++) {
            this.waves.push({
                radius: i * 40,
                alpha: 1 - (i * 0.2),
                speed: 100 + i * 20
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.waves.forEach(wave => {
            wave.radius += wave.speed * (deltaTime / 1000);
            wave.alpha *= 0.99;
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.waves.forEach(wave => {
            ctx.globalAlpha = alpha * wave.alpha;
            
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 8;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, wave.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = '#D2691E';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, wave.radius - 5, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.restore();
    }
}

class ShadowStrikeEffect {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.lifetime = 800;
        this.maxLifetime = 800;
        this.strikes = [];
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.strikes.push({
                    x: this.x + this.direction * i * 40,
                    y: this.y + (Math.random() - 0.5) * 100,
                    life: this.maxLifetime
                });
            }, i * 100);
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.strikes.forEach(strike => {
            strike.life -= deltaTime;
        });
        
        this.strikes = this.strikes.filter(strike => strike.life > 0);
    }
    
    isFinished() {
        return this.lifetime <= 0 && this.strikes.length === 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.strikes.forEach(strike => {
            const strikeAlpha = strike.life / this.maxLifetime;
            ctx.globalAlpha = alpha * strikeAlpha;
            
            ctx.strokeStyle = '#4B0082';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#4B0082';
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            ctx.moveTo(strike.x - 20, strike.y - 20);
            ctx.lineTo(strike.x + 20, strike.y + 20);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(strike.x - 20, strike.y + 20);
            ctx.lineTo(strike.x + 20, strike.y - 20);
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }
}

class PhoenixRisingEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 3000;
        this.maxLifetime = 3000;
        this.firebirds = [];
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.firebirds.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 200,
                    vy: -200 - Math.random() * 100,
                    life: this.maxLifetime,
                    size: 20 + i * 10
                });
            }, i * 500);
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.firebirds.forEach(bird => {
            bird.x += bird.vx * (deltaTime / 1000);
            bird.y += bird.vy * (deltaTime / 1000);
            bird.life -= deltaTime;
            
            bird.vy += 100 * (deltaTime / 1000);
        });
        
        this.firebirds = this.firebirds.filter(bird => bird.life > 0);
    }
    
    isFinished() {
        return this.lifetime <= 0 && this.firebirds.length === 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.firebirds.forEach(bird => {
            const birdAlpha = bird.life / this.maxLifetime;
            ctx.globalAlpha = alpha * birdAlpha;
            
            const gradient = ctx.createRadialGradient(bird.x, bird.y, 0, bird.x, bird.y, bird.size);
            gradient.addColorStop(0, '#ffff00');
            gradient.addColorStop(0.5, '#ff6600');
            gradient.addColorStop(1, '#ff0000');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.restore();
    }
}

class ThunderGodEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 4000;
        this.maxLifetime = 4000;
        this.bolts = [];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                this.createLightningBolt();
            }, i * 200);
        }
    }
    
    createLightningBolt() {
        const startX = this.x + (Math.random() - 0.5) * 200;
        const startY = 0;
        const endX = this.x + (Math.random() - 0.5) * 100;
        const endY = this.y + 50;
        
        const segments = [];
        let currentX = startX;
        let currentY = startY;
        
        while (currentY < endY) {
            segments.push({ x: currentX, y: currentY });
            currentX += (Math.random() - 0.5) * 30;
            currentY += 15 + Math.random() * 15;
        }
        
        segments.push({ x: endX, y: endY });
        this.bolts.push({ segments, life: this.maxLifetime });
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.bolts.forEach(bolt => {
            bolt.life -= deltaTime;
        });
        
        this.bolts = this.bolts.filter(bolt => bolt.life > 0);
    }
    
    isFinished() {
        return this.lifetime <= 0 && this.bolts.length === 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        this.bolts.forEach(bolt => {
            const boltAlpha = bolt.life / this.maxLifetime;
            ctx.globalAlpha = alpha * boltAlpha;
            
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 8;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 25;
            
            ctx.beginPath();
            ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
            
            bolt.segments.forEach(segment => {
                ctx.lineTo(segment.x, segment.y);
            });
            
            ctx.stroke();
        });
        
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class AbsoluteZeroEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 5000;
        this.maxLifetime = 5000;
        this.radius = 150;
        this.crystals = [];
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.crystals.push({
                x: x + Math.cos(angle) * this.radius,
                y: y + Math.sin(angle) * this.radius,
                angle: angle,
                size: 20 + Math.random() * 15
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        this.radius += Math.sin(Date.now() * 0.003) * 2;
        
        this.crystals.forEach(crystal => {
            crystal.x = this.x + Math.cos(crystal.angle) * this.radius;
            crystal.y = this.y + Math.sin(crystal.angle) * this.radius;
            crystal.size += Math.sin(Date.now() * 0.005 + crystal.angle) * 0.5;
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(0.5, 'rgba(200, 255, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(150, 220, 255, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        this.crystals.forEach(crystal => {
            ctx.fillStyle = '#e0f6ff';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(crystal.x, crystal.y - crystal.size);
            ctx.lineTo(crystal.x - crystal.size * 0.5, crystal.y + crystal.size);
            ctx.lineTo(crystal.x + crystal.size * 0.5, crystal.y + crystal.size);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
        
        ctx.restore();
    }
}

class WindGodEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 3500;
        this.maxLifetime = 3500;
        this.spirals = [];
        
        for (let i = 0; i < 5; i++) {
            this.spirals.push({
                radius: i * 40,
                rotation: 0,
                speed: 2 + i * 0.5,
                alpha: 1 - (i * 0.2)
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.spirals.forEach(spiral => {
            spiral.rotation += spiral.speed * (deltaTime / 1000);
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        this.spirals.forEach(spiral => {
            ctx.save();
            ctx.rotate(spiral.rotation);
            ctx.globalAlpha = alpha * spiral.alpha;
            
            ctx.strokeStyle = '#88ff88';
            ctx.lineWidth = 6;
            
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 4; angle += 0.2) {
                const r = spiral.radius + angle * 10;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 4; angle += 0.2) {
                const r = spiral.radius + angle * 10;
                const x = Math.cos(angle) * r;
                const y = Math.sin(angle) * r;
                
                if (angle === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            ctx.restore();
        });
        
        ctx.restore();
    }
}

class MountainCrushEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 4000;
        this.maxLifetime = 4000;
        this.rocks = [];
        
        for (let i = 0; i < 8; i++) {
            this.rocks.push({
                x: x + (Math.random() - 0.5) * 300,
                y: y - 200 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 50,
                vy: 0,
                size: 20 + Math.random() * 30,
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: this.maxLifetime
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.rocks.forEach(rock => {
            rock.x += rock.vx * (deltaTime / 1000);
            rock.y += rock.vy * (deltaTime / 1000);
            rock.vy += 300 * (deltaTime / 1000);
            rock.rotation += rock.rotationSpeed * (deltaTime / 1000);
            rock.life -= deltaTime;
        });
        
        this.rocks = this.rocks.filter(rock => rock.life > 0 && rock.y < this.y + 200);
    }
    
    isFinished() {
        return this.lifetime <= 0 && this.rocks.length === 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.rocks.forEach(rock => {
            const rockAlpha = rock.life / this.maxLifetime;
            ctx.globalAlpha = alpha * rockAlpha;
            
            ctx.translate(rock.x, rock.y);
            ctx.rotate(rock.rotation);
            
            ctx.fillStyle = '#8B4513';
            ctx.strokeStyle = '#654321';
            ctx.lineWidth = 3;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * rock.size;
                const y = Math.sin(angle) * rock.size;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        });
        
        ctx.restore();
    }
}

class ShadowStormEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 4500;
        this.maxLifetime = 4500;
        this.darkness = [];
        
        for (let i = 0; i < 20; i++) {
            this.darkness.push({
                x: x + (Math.random() - 0.5) * 400,
                y: y + (Math.random() - 0.5) * 300,
                radius: 20 + Math.random() * 40,
                alpha: 0.3 + Math.random() * 0.4,
                speed: 30 + Math.random() * 50,
                angle: Math.random() * Math.PI * 2
            });
        }
    }
    
    update(deltaTime) {
        this.lifetime -= deltaTime;
        
        this.darkness.forEach(dark => {
            dark.x += Math.cos(dark.angle) * dark.speed * (deltaTime / 1000);
            dark.y += Math.sin(dark.angle) * dark.speed * (deltaTime / 1000);
            dark.angle += 0.5 * (deltaTime / 1000);
        });
    }
    
    isFinished() {
        return this.lifetime <= 0;
    }
    
    render(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        
        ctx.save();
        
        this.darkness.forEach(dark => {
            ctx.globalAlpha = alpha * dark.alpha;
            
            const gradient = ctx.createRadialGradient(dark.x, dark.y, 0, dark.x, dark.y, dark.radius);
            gradient.addColorStop(0, '#4B0082');
            gradient.addColorStop(0.7, '#2F1B4C');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(dark.x, dark.y, dark.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8A2BE2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(dark.x, dark.y, dark.radius, 0, Math.PI * 2);
            ctx.stroke();
        });
        
        ctx.restore();
    }
}