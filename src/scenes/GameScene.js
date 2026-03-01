import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background
    this.add.image(width / 2, height / 2, 'bg').setDisplaySize(width, height);

    // Player demon
    this.player = this.physics.add.sprite(width / 2, height - 80, 'demon');
    this.player.setScale(1.5);
    this.player.setCollideWorldBounds(true);
    this.player.setDrag(300);
    this.player.setMaxVelocity(400);

    // Orbs (collectibles) - demon cycle essence
    this.orbs = this.physics.add.group();
    this.spawnOrbs();

    // Collision
    this.physics.add.overlap(this.player, this.orbs, this.collectOrb, null, this);

    // Score
    this.score = 0;
    this.scoreText = this.add.text(16, 16, 'Essence: 0', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#cc88ff',
    });

    // Controls - touch/mouse
    this.cursors = this.input.keyboard?.createCursorKeys() || {};
    this.pointerX = width / 2;

    this.input.on('pointermove', (pointer) => {
      this.pointerX = pointer.x;
    });

    this.input.on('pointerdown', (pointer) => {
      this.pointerX = pointer.x;
    });
  }

  spawnOrbs() {
    const { width, height } = this.cameras.main;
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, width - 50);
      const y = Phaser.Math.Between(100, height - 150);
      const orb = this.orbs.create(x, y, 'orb');
      orb.setScale(1.2);
    }
  }

  collectOrb(player, orb) {
    orb.destroy();
    this.score += 10;
    this.scoreText.setText('Essence: ' + this.score);

    // Respawn orb
    const { width, height } = this.cameras.main;
    const x = Phaser.Math.Between(50, width - 50);
    const y = Phaser.Math.Between(100, height - 150);
    const newOrb = this.orbs.create(x, y, 'orb');
    newOrb.setScale(1.2);
  }

  update() {
    const { width } = this.cameras.main;

    // Move toward pointer/touch
    const diff = this.pointerX - this.player.x;
    if (Math.abs(diff) > 20) {
      this.player.setVelocityX(diff * 2);
    } else {
      this.player.setVelocityX(0);
    }

    // Keyboard fallback
    if (this.cursors.left?.isDown) {
      this.player.setVelocityX(-300);
    } else if (this.cursors.right?.isDown) {
      this.player.setVelocityX(300);
    }
  }
}
