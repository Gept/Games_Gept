'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    // лучше обратить условие
    // (сначала проверить аргументы, а потом писать основной код)
    if (vector instanceof Vector) {
      const x = this.x + vector.x;
      const y = this.y + vector.y;
      return new Vector(x, y);
    }
    throw new Error('Можно прибавлять к вектору только вектор типа ');
  }

  times(multiplier) {
    const x = this.x * multiplier;
    const y = this.y * multiplier;
    return new Vector(x, y);
  }
}

class Actor {
  // лучше не опускать аргументы у конструктора Vector
  // если значение по-умолчанию кто-то изменит, то всё сломается
  constructor(pos = new Vector(), size = new Vector(1, 1), speed = new Vector()) {
    if (!(pos instanceof Vector) ||
        !(size instanceof Vector) ||
        !(speed instanceof Vector)) {
          throw Error('arguments error');
        }
    this.pos = pos;
    this.size = size;
    this.speed = speed;
    // лучше возвращать строку из геттера,
    // так не будет лишнего поля, и значение нельзя будет поменять
    // в классах наследниках просто переопределять метод, а не поле
    this._type = 'actor';
  }

  act() {

  }

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
    return this._type;
  }

  isIntersect(actor) {
    // вторая половина проверки лишняя
    if (!(actor instanceof Actor) || actor === undefined) {
          throw Error('arguments error');
    }

    // отричательный размер можно не проверять
    if (actor === this || actor.size.x < 0 || actor.size.y < 0) {
          return false;
    // форматирование
      }

    // отрицание можно внести в скобки, если заменить || на &&
    // а операторы сравнения на противоположные
    // >= на <
    // <=  на >
  return !(actor.left >= this.right || actor.right <= this.left || actor.top >= this.bottom || actor.bottom <= this.top);
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.height = grid.length;
    this.width = grid.reduce((acc, el) => el.length > acc ? el.length : acc, 0);
    this.status = null;
    this.finishDelay = 1;
    this.player = actors.find(el => el.type === 'player');
  }

  isFinished() {
    // тренарный оператор сравнения тут не нужен
    // можно возвращать сразу выражение до ?
    return this.status !== null && this.finishDelay < 0 ? true : false;
  }

  actorAt(actor) {
    // первая половина проверки лишняя,
    // я бы вообще эту проверку убрал,
    // тогда если что-то не то передали,
    // то просто вернётся undefined
    if (!actor || !(actor instanceof Actor)) {
      throw Error('arguments error');
    }
    return this.actors.find(el => el.isIntersect(actor));
  }

  // линий метод, если в ячейке grid что-то есть, то это препятствие
  // сейчас чтобы ввести новое препятствие
  // придётся править код в нескольких местах
  isObstacle(x, y) {
    const wall = 'wall';
    const lava = 'lava';
    const grid = this.grid;
    return (grid[y] && grid[y][x] && ((grid[y][x] === wall) || (grid[y][x] === lava)));
  }

  obstacleAt(nextPos, size) {
    if (!(nextPos instanceof Vector) ||
        !(size instanceof Vector)) {
      throw Error('arguments error');
    }
    // этот метод нужно переписать
    // алгоритм примерно следющий:
    // найти клетки, на которых находится объект,
    // перебрать их в цикле,
    // если клетка не пуста, вернуть её значение
    const sizeX = size.x - 0.0001;
    const sizeY = size.y - 0.0001;
    const grid = this.grid;
    const x = nextPos.x;
    const y = nextPos.y;
    const left = Math.floor(x);
    const top = Math.floor(y);
    const bottom = Math.floor(y + sizeY);
    const rigth = Math.floor(x + sizeX);
    const middle = Math.round(top + sizeY / 2);

    if (this.isObstacle(left, top)) {
      return grid[top][left];
    }
    if (this.isObstacle(rigth, top)) {
      return grid[top][rigth];
    }
    if (this.isObstacle(left, bottom)) {
        return grid[bottom][left];
    }
    if (this.isObstacle(rigth, bottom)) {
        return grid[bottom][rigth];
    }
    if (this.isObstacle(left, middle)) {
        return grid[middle][left];
    }
    if (this.isObstacle(rigth, middle)) {
        return grid[middle][rigth];
    }
    if (left < 0 || x + sizeX > this.width || top < 0) {
      return 'wall';
    }
    if (y + sizeY > this.height) {
      return 'lava';
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(el => el !== actor);
  }

  noMoreActors(type) {
    // тут лучше использовать другой метод массива,
    // который возвращает true/false
    const result = this.actors.filter(el => el.type === type);
    return result.length > 0 ? false : true;
  }

  playerTouched(type, actor) {
    if (this.status !== null) {
      return;
    }
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    } else if (type === 'coin') {
      this.removeActor(actor);
      // дублирование логики noMoreActors
      if (!this.actors.find(el => el.type === 'coin')) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(entities) {
    this.entities = entities;
  }

  // entity :)
  actorFromSymbol(entiti) {
    // фигурные скобки лучше не опускать
    // проверка тут, кстати, не нужна
    if (!entiti) return;
    // ключ не нужно искать, он приходит в аргументе
    const key = Object.keys(this.entities).find(key => key === entiti);
    return key ? this.entities[key] : key;
  }

  obstacleFromSymbol(entiti) {
    switch(entiti) {
      case 'x': return 'wall';
      case '!': return 'lava';
      // линяя строчка
      default: return;
    }
  }

  createGrid(masOfString) {
    return masOfString.map(str => str.split('').map(el => {
      // дублирование obstacleFromSymbol
      if(el === '!') {
        return 'lava';
      } else if (el === 'x') {
        return 'wall';
      }
    }));
  }

  createActors(masOfActors) {
    // в этом методе можно использовать reduce
    const mas = masOfActors.map(str => str.split(''));
    const actors = [];
    mas.forEach((row, y) => {
      row.forEach((cell, x) => {
        // лучше добавить значение по-умолчанию аргументу в конструкторе,
        // чтобы не проверять везде this.entities перед использованием
        // this.entities[cell] лучше записать в переменную,
        // чтобы не писать несколько раз
        // вторая проверка в if избыточна
        // (tyoeof покрывает кейс с undefined/null)
        if (this.entities && this.entities[cell] && typeof this.entities[cell] === 'function') {
          const actor = new this.entities[cell] (new Vector(x, y));
          if (actor instanceof Actor) {
              actors.push(actor);
          }
        }
      });
    });
    return actors;
  }

  parse(plan) {
    const grid = this.createGrid(plan);
    const actors = this.createActors(plan);
    return new Level(grid, actors);
  }
}

class Player extends Actor {
  constructor(location) {
    super(location, new Vector(0.8, 1.5));
    // лучше перегрузить метод
    this._type = 'player';
    // не нужно мутировать обхекты Vector
    // pos, size, speed должны задваться через вызов родительского конструктора
    this.pos.y -= 0.5;
  }
}

class Fireball extends Actor {
  // не опускайте аргументы конструтора Vector
  constructor(location = new Vector(), speed = new Vector()) {
    // второй аргумент нам известен,
    // не стоит передавать туда undefined и рассчитывать,
    // что там правильное значение по-умолчанию
    super(location, undefined, speed);
    // лучше перегрузить метод
    this._type = 'fireball';
  }

  act(time, level) {
    const nextPos = this.getNextPosition(time);
    const obj = level.obstacleAt(nextPos, this.size);
    if (obj) {
      this.handleObstacle();
      return;
    }
    this.pos = nextPos;
  }

  getNextPosition(time = 1) {
    // тут нужно использовать методы класса Vector
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    // тут нужно использовать метод Vector
    // и сравнения тут не нужны :)
    if (this.speed.x > 0 || this.speed.y > 0) {
      this.speed.x = -this.speed.x;
      this.speed.y = -this.speed.y;
    } else {
      this.speed.x = Math.abs(this.speed.x);
      this.speed.y = Math.abs(this.speed.y);
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(location) {
    super(location, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(location) {
    super(location, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(location) {
    super(location, new Vector(0, 3));
    this.start = location;
  }

  handleObstacle() {
    this.pos = this.start;
  }
}

class Coin extends Actor {
  constructor(location = new Vector()) {
    super(location, new Vector(0.6, 0.6));
    // не мутируйте Vector, pos через родительский конструктор
    this.pos.x += 0.2;
    this.pos.y += 0.1;
    // перегрузить метод
    this._type = 'coin';
    this.location = location;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * (Math.PI * 2);
  }

  act(time) {
    // я бы написать просто this.pos = this.get...
    const next = this.getNextPosition(time);
    this.pos = next;
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    const newVector = this.getSpringVector();
    // метод класса Vector
    return new Vector(this.location.x + newVector.x, this.location.y + newVector.y);
  }
}

const actorDict = {
  '@': Player,
  'v': FireRain,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'o': Coin
} // точка с запятой :)

const parser = new LevelParser(actorDict);

loadLevels()
  .then(schemas => runGame(JSON.parse(schemas), parser, DOMDisplay))
  .then(() => alert('Вы выиграли приз!'))
  .catch(err => {});