import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Title
    const title = this.add.text(width / 2, height * 0.3, 'DEMON CYCLE', {
      fontSize: '48px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff4500',
      stroke: '#8b0000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.4, 'Tap to Begin', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#cc88ff',
    });
    subtitle.setOrigin(0.5);

    // Pulsing effect on subtitle
    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Play button
    const playBtn = this.add.text(width / 2, height * 0.6, 'PLAY', {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
    });
    playBtn.setOrigin(0.5);
    playBtn.setInteractive({ useHandCursor: true });

    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    playBtn.on('pointerover', () => {
      playBtn.setScale(1.1);
      playBtn.setColor('#ff4500');
    });

    playBtn.on('pointerout', () => {
      playBtn.setScale(1);
      playBtn.setColor('#ffffff');
    });

    // Touch/click anywhere to start
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
