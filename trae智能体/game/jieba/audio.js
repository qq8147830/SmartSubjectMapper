class AudioSystem {
    constructor() {
        this.sounds = {};
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.enabled = true;
        this.currentMusic = null;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        
        this.createSimpleSounds();
    }
    
    createSimpleSounds() {
        this.sounds = {
            punch: this.createTone(200, 0.1, 'sine'),
            kick: this.createTone(150, 0.15, 'square'),
            block: this.createTone(400, 0.1, 'sawtooth'),
            hit: this.createTone(300, 0.2, 'triangle'),
            jump: this.createTone(500, 0.3, 'sine'),
            special: this.createTone(600, 0.5, 'sawtooth'),
            ultimate: this.createTone(800, 1.0, 'square'),
            combo: this.createTone(700, 0.3, 'triangle'),
            victory: this.createTone(400, 2.0, 'sine'),
            gameOver: this.createTone(200, 3.0, 'sawtooth'),
            
            fireball: this.createTone(250, 0.4, 'sine'),
            lightning: this.createTone(400, 0.6, 'square'),
            ice: this.createTone(300, 0.8, 'triangle'),
            wind: this.createTone(350, 0.5, 'sine'),
            rock: this.createTone(180, 0.7, 'sawtooth'),
            shadow: this.createTone(250, 0.6, 'triangle')
        };
    }
    
    createTone(frequency, duration, waveType = 'sine') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        
        return {
            play: () => {
                if (!this.enabled || !this.sfxEnabled) return;
                
                const currentTime = audioContext.currentTime;
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, currentTime);
                oscillator.type = waveType;
                
                gainNode.gain.setValueAtTime(0, currentTime);
                gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + duration);
            }
        };
    }
    
    playSound(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }
    
    playMusic(musicName) {
        if (!this.enabled || !this.musicEnabled) return;
        
        if (this.currentMusic) {
            this.currentMusic.stop();
        }
        
        if (this.sounds[musicName]) {
            this.currentMusic = this.sounds[musicName];
            this.currentMusic.play();
        }
    }
    
    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }
    
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }
    
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.updateVolumes();
    }
    
    updateVolumes() {
        Object.values(this.sounds).forEach(sound => {
            if (sound.setVolume) {
                sound.setVolume(this.masterVolume * (sound.isMusic ? this.musicVolume : this.sfxVolume));
            }
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
    }
    
    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
    }
    
    enable() {
        this.enabled = true;
    }
    
    disable() {
        this.enabled = false;
        this.stopMusic();
    }
    
    cleanup() {
        this.stopMusic();
        Object.values(this.sounds).forEach(sound => {
            if (sound.cleanup) {
                sound.cleanup();
            }
        });
    }
}

class SoundEffect {
    constructor(frequency, duration, waveType = 'sine', volume = 0.3) {
        this.frequency = frequency;
        this.duration = duration;
        this.waveType = waveType;
        this.volume = volume;
        this.isPlaying = false;
    }
    
    play() {
        if (this.isPlaying) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(this.frequency, audioContext.currentTime);
            oscillator.type = this.waveType;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + this.duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + this.duration);
            
            this.isPlaying = true;
            
            oscillator.onended = () => {
                this.isPlaying = false;
            };
            
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

const audioSystem = new AudioSystem();