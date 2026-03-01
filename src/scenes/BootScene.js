import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // Create simple graphics for demon and UI (no external assets needed)
    const demonGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    demonGraphics.fillStyle(0x8b0000, 1);
    demonGraphics.fillCircle(16, 16, 16);
    demonGraphics.fillStyle(0xff4500, 1);
    demonGraphics.fillCircle(12, 10, 4);
    demonGraphics.fillCircle(20, 10, 4);
    demonGraphics.generateTexture('demon', 32, 32);

    const orbGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    orbGraphics.fillStyle(0x4a0080, 1);
    orbGraphics.fillCircle(12, 12, 12);
    orbGraphics.fillStyle(0x8b00ff, 0.8);
    orbGraphics.fillCircle(12, 12, 8);
    orbGraphics.generateTexture('orb', 24, 24);

    const bgGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bgGraphics.fillStyle(0x0a0a0f, 1);
    bgGraphics.fillRect(0, 0, 800, 600);
    bgGraphics.generateTexture('bg', 800, 600);
  }

  create() {
    this.scene.start('MenuScene');
  }
}
