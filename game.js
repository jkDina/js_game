'use strict';
/*Необходимо реализовать класс Vector, который позволит
контролировать расположение объектов в двумерном пространстве и
управлять их размером и перемещением.*/
class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Can be added only the vector type');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    times(k) {
        return new Vector(this.x * k, this.y * k);
    }
}

/*
const start = new Vector(30, 50);
const moveTo = new Vector(5, 10);
const finish = start.plus(moveTo.times(2));

console.log(`Исходное расположение: ${start.x}:${start.y}`);
console.log(`Текущее расположение: ${finish.x}:${finish.y}`);
*/
class Actor {
    constructor(pos = new Vector(0,0), size = new Vector(1,1), speed = new Vector(0,0)) {
        if (!(pos instanceof Vector)) {
            throw new Error('pos is not a vector!');
        }
        this.pos = pos;

        if (!(size instanceof Vector)) {
            throw new Error('size is not a vector!');
        }
        this.size = size;

        if (!(speed instanceof Vector)) {
            throw new Error('speed is not a vector!');
        }
        this.speed = speed;
    }
    act() {}
    get left() {
        return this.pos.x;
    }
    get right() {
        return this.pos.x + this.size.x ;
    }
    get top() {
        return this.pos.y;
    }
    get bottom() {
        return this.pos.y + this.size.y;
    }
    get type() {
        return "actor";
    }
    isIntersect (actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('Parameter is not a vector!');
        }
        if (actor === this)
            return false;
        /*если правая граница 1-го прямоугольника лежит между левой и
        правой границей 2-го прямоугольника или наоборот (правая  граница 2- го прямоугольника лежит
        между правой и левой границей  1-го прямоугольника*/
        const condX = (this.right <= actor.right) && (this.right >= actor.left) || (actor.right <= this.right) && (actor.right >= this.left);
        const condY = (this.top >= actor.top) && (this.top <= actor.bottom) || (actor.top >= this.top) && (actor.top <= this.bottom);

        if (condX && condY) {
            if (this.right === actor.left || this.left === actor.right)
                return false;
            if (this.bottom === actor.top || this.top === actor.bottom)
                return false;
            return true
        }
        return false;
    }
}
/*
const items = new Map();
const player = new Actor();
items.set('Игрок', player);
items.set('Первая монета', new Actor(new Vector(10, 10)));
items.set('Вторая монета', new Actor(new Vector(15, 5)));

function position(item) {
  return ['left', 'top', 'right', 'bottom']
    .map(side => `${side}: ${item[side]}`)
    .join(', ');
}

function movePlayer(x, y) {
  player.pos = player.pos.plus(new Vector(x, y));
}

function status(item, title) {
  console.log(`${title}: ${position(item)}`);
  if (player.isIntersect(item)) {
    console.log(`Игрок подобрал ${title}`);
  }
}

items.forEach(status);
movePlayer(10, 10);
items.forEach(status);
movePlayer(5, -5);
items.forEach(status);
*/
class Level {
    constructor(grid, actors) {
        if (!actors) actors = [];
        if (!grid) grid = [];
        this.grid = grid;
        this.actors = actors;

        for (let i = 0; i < actors.length; i++) {
            if (actors[i].type === 'player') {
                this.player = actors[i];
                break;
            }
        }
        this.height = grid.length;
        this.width = Math.max(...grid.map(item => item.length), 0);
        this.status = null;
        this.finishDelay = 1;
    }
    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }
    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error("Actor type is not correct");
        }
        for (let actor_ of this.actors) {
            if (actor.isIntersect(actor_)) {
                return actor_
            }
        }
    }
    obstacleAt(pos, size) {
        if (!(pos instanceof Vector)) {
            throw new Error('pos is not a vector!');
        }
        if (!(size instanceof Vector)) {
            throw new Error('size is not a vector!');
        }
        let x1 = Math.floor(pos.x);
        let x2 = Math.ceil(pos.x + size.x);
        let y1 = Math.floor(pos.y);
        let y2 = Math.ceil(pos.y + size.y);
        if (x1 < 0)
            return 'wall';
        if (x2 > this.width)
            return 'wall';
        if (y1 < 0)
            return 'wall';
        if (y2 > this.height)
            return 'lava';

        for (let i = x1; i < x2; i++) {
            for (let j = y1; j < y2; j++) {
                if (this.grid[j][i])
                    return this.grid[j][i];
            }
        }
    }
    removeActor(actor) {
        let index = this.actors.indexOf(actor);
        if (index > -1) {
            this.actors.splice(index, 1);
        }
    }

    noMoreActors(type) {
        for (let actor of this.actors) {
            if (actor.type === type)
                return false;
        }
        return true;
    }
    playerTouched(type, actor) {
        if (this.status !== null)
            return;

        if (['lava', 'fireball'].includes(type)) {
            this.status = 'lost';
            return;
        }
        if (type === 'coin' && actor.type === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors(type)) {
                this.status = 'won';
            }
        }
    }
}
/*
const grid = [
  [undefined, undefined],
  ['wall', 'wall']
];

function MyCoin(title) {
  this.type = 'coin';
  this.title = title;
}
MyCoin.prototype = Object.create(Actor);
MyCoin.constructor = MyCoin;

const goldCoin = new MyCoin('Золото');
const bronzeCoin = new MyCoin('Бронза');
const player = new Actor();
const fireball = new Actor();

const level = new Level(grid, [ goldCoin, bronzeCoin, player, fireball ]);

level.playerTouched('coin', goldCoin);
level.playerTouched('coin', bronzeCoin);

if (level.noMoreActors('coin')) {
  console.log('Все монеты собраны');
  console.log(`Статус игры: ${level.status}`);
}

const obstacle = level.obstacleAt(new Vector(1, 1), player.size);
if (obstacle) {
  console.log(`На пути препятствие: ${obstacle}`);
}

const otherActor = level.actorAt(player);
if (otherActor === fireball) {
  console.log('Пользователь столкнулся с шаровой молнией');
}
*/

class LevelParser {
    constructor(actorsDict) {
        this.actorsDict = actorsDict;
    }
    actorFromSymbol(symbol) {
        if (!symbol) {
            return;
        }
        return this.actorsDict[symbol];
    }
    obstacleFromSymbol(symbol) {
        if (symbol == 'x') {
            return 'wall';
        } else if (symbol == '!') {
            return 'lava';
        } else {
            return undefined
        }
    }
    createGrid(plan) {
        let grid = [];
        for (let i = 0; i < plan.length; i++){
            let arr = [];
            for (let j = 0; j < plan[i].length; j++) {
                arr.push(this.obstacleFromSymbol(plan[i][j]));
            }
            grid.push(arr);
        }
        return grid;
    }
    createActors(plan) {
        let actors = [];
        for (let i = 0; i < plan.length; i++){
            for (let j = 0; j < plan[i].length; j++) {
                let actorSymbol = plan[i][j];
                if (this.actorsDict && this.actorsDict[actorSymbol] && typeof this.actorsDict[actorSymbol] === 'function' ) {
                    let ActorClass = this.actorsDict[actorSymbol];
                    let actor = new ActorClass(new Vector(j, i));
                    if (actor instanceof Actor) {
                        actors.push(actor);
                    }
                }
            }

        }
        return actors;
    }
    parse(plan) {
        let grid = this.createGrid(plan);
        let actors = this.createActors(plan);
        let level = new Level(grid, actors);
        return level;
    }
}

class Fireball extends Actor {
    constructor(pos = new Vector(0,0), speed = new Vector(0,0)) {
        super(pos, new Vector(1,1), speed);
    }
    get type() {
        return 'fireball';
    }
    getNextPosition(t = 1) {
        const x = this.pos.x + this.speed.x * t;
        const y = this.pos.y + this.speed.y * t;
        return new Vector(x,y);
    }
    handleObstacle() {
        this.speed.x = -this.speed.x;
        this.speed.y = -this.speed.y;
    }
    act(t, level) {
        const pos = this.getNextPosition(t);
        if (level.obstacleAt(pos, this.size)) {
            this.handleObstacle();
        } else {
            this.pos = pos;
        }
    }
}
class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(2, 0));
    }
}
class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 2));
    }
}
class FireRain extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 3));
        this.posStart = pos;
    }
    handleObstacle() {
        this.pos = this.posStart;
    }
}

class Coin extends Actor {
    constructor(pos) {
        pos = pos || new Vector(0, 0);
        const startPos = new Vector(pos.x + 0.2, pos.y + 0.1);
        super(startPos, new Vector(0.6,0.6));
        this.startPos = startPos;
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * 2 * Math.PI;
    }
    get type() {
        return 'coin';
    }
    updateSpring(t = 1) {
        this.spring += this.springSpeed * t;
    }
    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist);
    }
    getNextPosition(t = 1) {
        this.updateSpring(t);
        const springVector = this.getSpringVector();
        return new Vector(this.startPos.x + springVector.x, this.startPos.y + springVector.y);
    }
    act(t = 1) {
        this.pos = this.getNextPosition(t);
    }
}
class Player extends Actor {
    constructor(pos) {
        pos = pos || new Vector(0, 0);
        super(new Vector(pos.x, pos.y - 0.5), new Vector(0.8,1.5));
    }
    get type() {
        return 'player';
    }
}
/*
const time = 5;
const speed = new Vector(1, 0);
const position = new Vector(5, 5);

const ball = new Fireball(position, speed);

const nextPosition = ball.getNextPosition(time);
console.log(`Новая позиция: ${nextPosition.x}: ${nextPosition.y}`);

ball.handleObstacle();
console.log(`Текущая скорость: ${ball.speed.x}: ${ball.speed.y}`);
*/

/*
const plan = [
  ' @ ',
  'x!x'
];

const actorsDict = Object.create(null);
actorsDict['@'] = Actor;

const parser = new LevelParser(actorsDict);
const level = parser.parse(plan);

level.grid.forEach((line, y) => {
  line.forEach((cell, x) => console.log(`(${x}:${y}) ${cell}`));
});

level.actors.forEach(actor => console.log(`(${actor.pos.x}:${actor.pos.y}) ${actor.type}`));
*/

/*const grid = [
  new Array(3),
  ['wall', 'wall', 'lava']
];
//const level = new Level(grid);
//runLevel(level, DOMDisplay);

const schema = [
  '         ',
  '         ',
  '         ',
  '         ',
  '     !xxx',
  ' @       ',
  'xxx!     ',
  '         '
];
const actorDict = {
  '@': Player
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay);*/