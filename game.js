'use strict';

// форматирование не соответствует правилам
// https://netology-university.bitbucket.io/codestyle/javascript/
class Vector {
    constructor(x = 0, y = 0) { 
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector.');
        }      
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    times(constant) {
        return new Vector(this.x * constant, this.y * constant);
    }
}

class Actor {
    constructor(pos, size, speed) {
        // тут нужно использовать задание
        // значений аргументов по-умолчанию
        if (!pos) {
            pos = new Vector(0, 0);
        }
        if (!size) {
            size = new Vector(1, 1);
        }
        if (!speed) {
            speed = new Vector(0, 0);
        }

        // форматирование
        if (!(pos instanceof Vector) ||
        !(size instanceof Vector) ||
        !(speed instanceof Vector)) {
            throw new Error(`Ошибка: Конструктор должен иметь объект типа Vector.`);
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
    }
    act() {}
    get left() {
        return this.pos.x;
    }
    get top() {
        return this.pos.y;
    }
    get right() {
        return this.pos.x + this.size.x;
    }
    get bottom() {
        return this.pos.y + this.size.y;
    }
    get type() {
        return 'actor';
    }
    isIntersect(otherActor) {
        if (!(otherActor instanceof Actor)) {
            throw new Error('Ошибка: Должен быть передан объект типа Actor.');
        } 
        // Объект не пересекается сам с собой.
        if (otherActor === this) {
            return false;
        }
        return this.right > otherActor.left && 
            this.left < otherActor.right && 
            this.top < otherActor.bottom && 
            this.bottom > otherActor.top
        }
    }
class Level {
    constructor(grid = [], actors = []) { 
        this.grid = grid; 
        this.actors = actors; 
        this.player = this.actors.find(actor => actor.type === 'player'); 
        this.height = this.grid.length; 
        this.width = this.grid.reduce((memo, item) => {
            if (memo > item.length) {
                return memo;
            // если if заканчивается на return, то else не нужен
            // в данном случае можно записать короче
            // с помощью тренарного оператора сравнения
            } else {
                return item.length;
            }
        }, 0);
        this.status = null; 
        this.finishDelay = 1; 
    }
    isFinished() { 
        return this.status !== null && this.finishDelay < 0;
    }
    actorAt(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('Ошибка: Должен быть передан объект типа Actor.');
        }
        return this.actors.find(el => el.isIntersect(actor));
    }
    obstacleAt(pos, size) {
        if (!(pos instanceof Vector) 
            || !(size instanceof Vector) ) {
            throw new Error('Ошибка: Должен быть передан объект типа Vector.');
        }
        const leftObstacle = Math.floor(pos.x);
        const rightObstacle = Math.ceil(pos.x + size.x);
        const topObstacle = Math.floor(pos.y);
        const bottomObstacle = Math.ceil(pos.y + size.y);
        if (leftObstacle < 0 
            || rightObstacle > this.width 
            || topObstacle < 0) {
            return 'wall';
        } 

        if (bottomObstacle > this.height) {
            return 'lava';
        }

        for (let i = topObstacle; i < bottomObstacle; i++) {
            for (let j = leftObstacle; j < rightObstacle; j++) {
                const gridLevel = this.grid[i][j];
                if (gridLevel) {
                    return gridLevel;
                }
            }
        }
    }
    removeActor(actor) {
        // обхект ищется в массиве 2 раза (includes и indexOf)
        // нужно сделать, чтобы искался 1 раз
        if (this.actors.includes(actor)) {
            this.actors.splice(this.actors.indexOf(actor), 1);
        }
    }
    noMoreActors(type) {
        return this.actors.findIndex(el => el.type === type) === -1;
    }

    playerTouched(type, actor) {
        if (this.status !== null) {
            return;
        }
        if (type === 'lava' || type === 'fireball') {
            this.status = 'lost'; 
            return;
        }
        if (type === 'coin' && actor.type === 'coin') {
            this.removeActor(actor);
            if (this.noMoreActors('coin')) {
                this.status = 'won';
            }
            // лишняя строчка
            return;
        }
    }
}

class LevelParser {
    constructor(obj) { 
      this.obj = obj;
    }
    actorFromSymbol(symb) {
      // проверка лишняя
      if (!(symb && this.obj)) {return undefined};
      return this.obj[symb];
    }
    obstacleFromSymbol(symb) {
      // проверка лишняя
      if (!symb) return undefined;
      return symbolObstacle[symb];    
    }
    createGrid(plan) {
      // здесь можно использовать сокращённую форму записи стрелочной функции
      return plan.map(row => {
        // строки лучше преобразовывать в массив с помощью метода split
        return [...row].map(el => symbolObstacle[el]);
      });
    }
    createActors(plan) {
      // заменить всё на стрелочные функции, убратьthisPlan
      let thisPlan = this;
      return plan.reduce(function(result, rowY, y) {
        // split
        [...rowY].forEach(function(rowX, x) {
          // лишняя проверка
          if (rowX) {
            // если значнеие присваивается переменной 1 раз,
            // то лучше использовать const
            let constructor = thisPlan.actorFromSymbol(rowX);
            // первая половина проверки лишняя
            if (constructor && typeof constructor === 'function') {
              // const
              let actor = new constructor (new Vector(x, y));
              if (actor instanceof Actor) {
                result.push(actor);
              }
            }
          }
        });
        return result;
      }, []);
    }
  
    parse(plan) {
      return new Level(this.createGrid(plan), this.createActors(plan));
    }
  }

  const symbolObstacle = {
    'x': 'wall',
    '!': 'lava'
  };
  
  // не используется
  const plan = [
    ' @ ',
    'x!x'
  ];
  
class Fireball extends Actor {
    constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
        const size = new Vector(1, 1);
        super(pos, size, speed);
    }
    get type() {
        return 'fireball';
    }
    getNextPosition(time = 1) {
        return this.pos.plus(this.speed.times(time));
    }
    handleObstacle() {
        this.speed = this.speed.times(-1);
    }
    act(time, level) {
        const nextPos = this.getNextPosition(time);
        if (level.obstacleAt(nextPos, this.size)) {
            this.handleObstacle();
        } else {
            this.pos = nextPos
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos = new Vector(0, 0)) {
        super(pos, new Vector(0, 3));
        this.startPos = this.pos;
    }
    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
        this.spring = Math.random() * (Math.PI * 2);
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.startPos = this.pos;
    }
    get type() {
        return 'coin';
    }
    updateSpring(time = 1) {
        this.spring += this.springSpeed * time;
    }
    getSpringVector() {
        return new Vector(0, Math.sin(this.spring) * this.springDist)
    }
    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.startPos.plus(this.getSpringVector());
    }
    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos = new Vector(0, 0)) {
        super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
    }
    get type() {
        return 'player';
    }
}


const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball

};
const parser = new LevelParser(actorDict);

loadLevels()
  .then((res) => {
    runGame(JSON.parse(res), parser, DOMDisplay)
.then(() =>alert('Вы выиграли!'))
});
