import Ember from 'ember';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import Pac from '../models/pac';
import SharedStuff from '../mixins/shared-stuff';
import Level from '../models/level';
import Level2 from '../models/level2';
import Ghost from '../models/ghost';


export default Ember.Component.extend(KeyboardShortcuts, SharedStuff, {

  didInsertElement() {
    this.startNewLevel();

    this.loop();
  },

  startNewLevel() {
    let level = this.loadNewLevel();
    level.restart()
    this.set('level', level)

    let pac = Pac.create({
      level: level,
      x: level.get('startingPac.x'),
      y: level.get('startingPac.y')
    });
    this.set('pac', pac);

    let ghosts = level.get('startingGhosts').map((startingPosition) => {
      return Ghost.create({
        level: level,
        x: startingPosition.x,
        y: startingPosition.y,
        pac: pac
      })
    })
    this.set('ghosts', ghosts)
  },


  levelNumber: 1,
  score: 0,

  lives: 3,

  levels: [Level2, Level],

  loadNewLevel() {
    let levelIndex = (this.get('levelNumber') - 1) % this.get('levels.length')
    let levelClass = this.get('levels')[levelIndex]
    return levelClass.create()
  },

  clearScreen() {
    let ctx = this.get('ctx');
    ctx.clearRect(0, 0, this.get('level.pixelWidth'), this.get('level.pixelHeight'));
  },

  processAnyPellets() {
    let x = this.get('pac.x');
    let y = this.get('pac.y');
    let grid = this.get('level.grid');

    if (grid[y][x] == 2) {
      grid[y][x] = 0;
      this.incrementProperty('score')

      if (this.get('level').isComplete()) {
        this.incrementProperty('levelNumber')
        this.startNewLevel()
      }
    } else if (grid[y][x] == 3) {
      grid[y][x] = 0;
      this.set('pac.powerMode', true)
    }
  },

  changePacDirection() {
    let intent = this.get('intent')
    if (this.pathBlockedInDirection(intent)) {
      this.set('direction', 'stopped');
    } else {
      this.set('direction', intent);
    }
  },

  collidedWithGhost() {
    return this.get('ghosts').any((ghost) => {
      return this.get('pac.x') == ghost.get('x') &&
        this.get('pac.y') == ghost.get('y')
    })
  },


  loop() {
    this.get('pac').move();
    this.get('ghosts').forEach((ghost) => {
      ghost.move()
    });

    this.processAnyPellets();

    this.clearScreen();
    this.drawGrid();
    this.get('pac').draw();
    this.get('ghosts').forEach((ghost) => {
      ghost.draw()
    });


    if (this.collidedWithGhost()) {
      this.decrementProperty('lives');
      this.restart();
    };

    Ember.run.later(this, this.loop, 1000 / 60);
  },

  keyboardShortcuts: {
    up() {
      this.set('pac.intent', 'up');
    },
    down() {
      this.set('pac.intent', 'down');
    },
    left() {
      this.set('pac.intent', 'left');
    },
    right() {
      this.set('pac.intent', 'right');
    },
  },


  drawWall(x, y) {
    let ctx = this.get('ctx');
    let squareSize = this.get('level.squareSize');

    ctx.fillStyle = '#000';
    ctx.fillRect(x * squareSize,
      y * squareSize,
      squareSize,
      squareSize)
  },

  drawGrid() {
    let grid = this.get('level.grid');
    grid.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell == 1) {
          this.drawWall(columnIndex, rowIndex);
        }
        if (cell == 2) {
          this.drawPellet(columnIndex, rowIndex);
        }
        if (cell == 3) {
          this.drawPowerPellet(columnIndex, rowIndex)
        }
      })
    })
  },

  drawPowerPellet(x, y) {
    let radiusDivisor = 4;
    this.drawCircle(x, y, radiusDivisor, 'stopped', 'green')
  },

  drawPellet(x, y) {
    let radiusDivisor = 6;
    this.drawCircle(x, y, radiusDivisor, 'stopped');
  },

  restart() {
    if (this.get('lives') <= 0) {
      this.set('score', 0)
      this.set('lives', 3)
      this.set('levelNumber', 1)
      this.startNewLevel()
    }
    this.get('pac').restart();
    this.get('ghosts').forEach(ghost => ghost.restart());
  },

});
