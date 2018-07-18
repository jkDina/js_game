'use strict';
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
        const v = this.speed.times(t).plus(this.pos);
        return v;
    }
    handleObstacle() {
        this.speed = this.speed.times(-1);
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
        const startPos = pos.plus(new Vector(0.2, 0.1));
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
        return this.startPos.plus(springVector);
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
