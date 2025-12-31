class AudioControls {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.isCollapsed = false;
        this.setupEventListeners();
        this.updateDisplay();
        this.setupKeyboardControls();
    }
    
    setupEventListeners() {
        this.setupAudioToggle();
        this.setupMusicToggle();
        this.setupSfxToggle();
        this.setupVolumeControls();
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '=') {
                e.preventDefault();
                this.toggleCollapse();
            }
        });
    }
    
    toggleCollapse() {
        const audioControls = document.getElementById('audioControls');
        if (audioControls) {
            this.isCollapsed = !this.isCollapsed;
            if (this.isCollapsed) {
                audioControls.classList.add('collapsed');
            } else {
                audioControls.classList.remove('collapsed');
            }
        }
    }
    
    setupAudioToggle() {
        const toggleAudioBtn = document.getElementById('toggleAudio');
        if (toggleAudioBtn && this.audioSystem) {
            toggleAudioBtn.addEventListener('click', () => {
                if (this.audioSystem.enabled) {
                    this.audioSystem.disable();
                } else {
                    this.audioSystem.enable();
                }
                this.updateAudioButton();
            });
        }
    }
    
    setupMusicToggle() {
        const toggleMusicBtn = document.getElementById('toggleMusic');
        if (toggleMusicBtn && this.audioSystem) {
            toggleMusicBtn.addEventListener('click', () => {
                this.audioSystem.toggleMusic();
                this.updateMusicButton();
            });
        }
    }
    
    setupSfxToggle() {
        const toggleSfxBtn = document.getElementById('toggleSfx');
        if (toggleSfxBtn && this.audioSystem) {
            toggleSfxBtn.addEventListener('click', () => {
                this.audioSystem.toggleSfx();
                this.updateSfxButton();
            });
        }
    }
    
    setupVolumeControls() {
        this.setupMasterVolume();
        this.setupMusicVolume();
        this.setupSfxVolume();
    }
    
    setupMasterVolume() {
        const masterVolumeSlider = document.getElementById('masterVolume');
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        
        if (masterVolumeSlider && masterVolumeValue && this.audioSystem) {
            masterVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.audioSystem.setMasterVolume(volume);
                masterVolumeValue.textContent = e.target.value + '%';
            });
        }
    }
    
    setupMusicVolume() {
        const musicVolumeSlider = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        
        if (musicVolumeSlider && musicVolumeValue && this.audioSystem) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.audioSystem.setMusicVolume(volume);
                musicVolumeValue.textContent = e.target.value + '%';
            });
        }
    }
    
    setupSfxVolume() {
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        
        if (sfxVolumeSlider && sfxVolumeValue && this.audioSystem) {
            sfxVolumeSlider.addEventListener('input', (e) => {
                const volume = parseInt(e.target.value) / 100;
                this.audioSystem.setSfxVolume(volume);
                sfxVolumeValue.textContent = e.target.value + '%';
            });
        }
    }
    
    updateDisplay() {
        this.updateAudioButton();
        this.updateMusicButton();
        this.updateSfxButton();
        this.updateVolumeDisplays();
    }
    
    updateAudioButton() {
        const toggleAudioBtn = document.getElementById('toggleAudio');
        if (toggleAudioBtn && this.audioSystem) {
            toggleAudioBtn.textContent = this.audioSystem.enabled ? 
                '🔊 音效: 开' : '🔇 音效: 关';
        }
    }
    
    updateMusicButton() {
        const toggleMusicBtn = document.getElementById('toggleMusic');
        if (toggleMusicBtn && this.audioSystem) {
            toggleMusicBtn.textContent = this.audioSystem.musicEnabled ? 
                '🎶 音乐: 开' : '🔇 音乐: 关';
        }
    }
    
    updateSfxButton() {
        const toggleSfxBtn = document.getElementById('toggleSfx');
        if (toggleSfxBtn && this.audioSystem) {
            toggleSfxBtn.textContent = this.audioSystem.sfxEnabled ? 
                '🔔 SFX: 开' : '🔇 SFX: 关';
        }
    }
    
    updateVolumeDisplays() {
        this.updateMasterVolumeDisplay();
        this.updateMusicVolumeDisplay();
        this.updateSfxVolumeDisplay();
    }
    
    updateMasterVolumeDisplay() {
        const masterVolumeSlider = document.getElementById('masterVolume');
        const masterVolumeValue = document.getElementById('masterVolumeValue');
        
        if (masterVolumeSlider && masterVolumeValue && this.audioSystem) {
            const volumePercent = Math.round((this.audioSystem.masterVolume || 0.8) * 100);
            masterVolumeSlider.value = volumePercent;
            masterVolumeValue.textContent = volumePercent + '%';
        }
    }
    
    updateMusicVolumeDisplay() {
        const musicVolumeSlider = document.getElementById('musicVolume');
        const musicVolumeValue = document.getElementById('musicVolumeValue');
        
        if (musicVolumeSlider && musicVolumeValue && this.audioSystem) {
            const volumePercent = Math.round((this.audioSystem.musicVolume || 0.7) * 100);
            musicVolumeSlider.value = volumePercent;
            musicVolumeValue.textContent = volumePercent + '%';
        }
    }
    
    updateSfxVolumeDisplay() {
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        const sfxVolumeValue = document.getElementById('sfxVolumeValue');
        
        if (sfxVolumeSlider && sfxVolumeValue && this.audioSystem) {
            const volumePercent = Math.round((this.audioSystem.sfxVolume || 0.8) * 100);
            sfxVolumeSlider.value = volumePercent;
            sfxVolumeValue.textContent = volumePercent + '%';
        }
    }
    
    destroy() {
        this.removeEventListeners();
    }
    
    removeEventListeners() {
        const toggleAudioBtn = document.getElementById('toggleAudio');
        const toggleMusicBtn = document.getElementById('toggleMusic');
        const toggleSfxBtn = document.getElementById('toggleSfx');
        const masterVolumeSlider = document.getElementById('masterVolume');
        const musicVolumeSlider = document.getElementById('musicVolume');
        const sfxVolumeSlider = document.getElementById('sfxVolume');
        
        if (toggleAudioBtn) {
            toggleAudioBtn.removeEventListener('click', this.toggleAudio);
        }
        
        if (toggleMusicBtn) {
            toggleMusicBtn.removeEventListener('click', this.toggleMusic);
        }
        
        if (toggleSfxBtn) {
            toggleSfxBtn.removeEventListener('click', this.toggleSfx);
        }
        
        if (masterVolumeSlider) {
            masterVolumeSlider.removeEventListener('input', this.masterVolumeHandler);
        }
        
        if (musicVolumeSlider) {
            musicVolumeSlider.removeEventListener('input', this.musicVolumeHandler);
        }
        
        if (sfxVolumeSlider) {
            sfxVolumeSlider.removeEventListener('input', this.sfxVolumeHandler);
        }
    }
}

let audioControls;

function initializeAudioControls() {
    if (window.game && window.game.audioSystem) {
        audioControls = new AudioControls(window.game.audioSystem);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAudioControls);
} else {
    initializeAudioControls();
}

window.addEventListener('resize', () => {
    if (audioControls) {
        audioControls.updateDisplay();
    }
});