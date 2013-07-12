window.requestAnimFrame = (function(callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

Math.valueOfpercent = function (percent, value){
	return (value*percent)/100;
};

Math.getRandomInt = function(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var EventDispatcher = (function(){

    function EventDispatcher(){
        this._listeners = {};
    }

    EventDispatcher.prototype.dispatchEvent = function(event, data){
        var _this = this;
        if(!this._listeners || !this._listeners[event]) return;
        this._listeners[event].forEach(function(callback){
            callback.call(_this, data);
        });
    };

    EventDispatcher.prototype.addEventListener = function(event, listener){
        if(!this._listeners) this._listeners = {};
        if(!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(listener);
    };

    EventDispatcher.prototype.removeEventListener = function(event, listener){
        if(!this._listeners[event]) return;
        var index = this._listeners[event].indexOf(listener);
        if(index > -1) this._listeners[event].splice(index, 1);
    };

    EventDispatcher.implementation = function(proto){
        var prop;
        for(prop in EventDispatcher.prototype){
            proto[prop] = EventDispatcher.prototype[prop];
        }
    };

    return EventDispatcher;

})();

var Loader = (function(parent){

    function Loader(){
        this.data = {};
        this.imagesData = [];
    }

    Loader.prototype = new parent;

    Loader.prototype.constructor = Loader;

    Loader.prototype.loadImages = function(images){
        var _this = this;
        this.imageCounter = 0;
        (this.imagesData = images).forEach(function(image){
            _this.loadImage(image);
        });
    };

    Loader.prototype.loadImage = function(data){
        var _this = this, image = new Image();
        if(this.imagesData.length === 0) this.imagesData.push(data);
        if(this.imageCounter == void 0) this.imageCounter = 0;
        image.onload = function(){
            _this.data[data.id] = this;
            _this.imageCounter++;
            if(_this.imageCounter === _this.imagesData.length){
                _this.imagesData.length = 0;
                _this.imageCounter = void 0;
                _this.dispatchEvent("complete")
            }
        };
        image.src = data.src;
    };

    Loader.prototype.getResult = function(id){
        return this.data[id];
    };

    return Loader;

})(EventDispatcher);

var Ticker = (function(parent){

    function Ticker(){}

    Ticker.prototype = new parent;

    Ticker.prototype.constructor = Ticker;

    Ticker.prototype.start = function(){
        var _this = this;
        this.dispatchEvent("tick");
        requestAnimFrame(function(){
            _this.start();
        })
    };

    return Ticker;

})(EventDispatcher);

var Stage = (function(){

    function Stage(){
        this.children = [];
        this.isRetina = false;
        this.w = 0;
        this.h = 0;
    }

    Stage.prototype.setWidth = function(w){
        this.w = this.canvas.width = w;
    };

    Stage.prototype.setHeight = function(h){
        this.h = this.canvas.height = h;
    };

    Stage.prototype.create = function(canvas){
        this.canvas = document.getElementById(canvas);
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.context = this.canvas.getContext("2d");
    };

    Stage.prototype.retina = function(){
        this.isRetina = true;
        this.w = this.canvas.width = this.w * 2;
        this.h = this.canvas.height = this.h * 2;
        this.context.scale(1, 1);
    };

    Stage.prototype.addChild = function(child){
        child.setStage(this);
        this.children.push(child);
    };

    Stage.prototype.removeChild = function(child){
        var index = this.children.indexOf(child);
        if(index > -1) this.children.splice(index, 1);
    };

    Stage.prototype.update = function(){
        this.context.clearRect(0, 0, this.w, this.h);
        if(this.isRetina) this.context.scale(1, 1);
        this.children.forEach(function(shape){
            shape.draw();
        });
    };

    return Stage;

})();

var Shape = (function(){

    function Shape(){
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this._collided = void 0;
        this.removed = false;
    }

    Shape.prototype.setStage = function(stage){
        this.stage = stage;
        this.setContext(this.stage.context);
    };

    Shape.prototype.setContext = function(context){
        this.context = context;
    };

    Shape.prototype.draw = function(){

    };

    Shape.prototype.collide = function(shape){
        if(!shape) return;
        if(this.x < shape.x + shape.w  && this.x + this.w  > shape.x &&
            this.y < shape.y + shape.h && this.y + this.h > shape.y){
            if(!this._collided){
                this._collided = shape;
                this.dispatchEvent("collide", shape);
                shape.dispatchEvent("collide", this);
            }
        }else{
            if(this._collided && this._collided == shape) this._collided = void 0;
        }
    };

    Shape.prototype.remove = function(){
        if(this.stage) this.stage.removeChild(this);
        this.removed = true;
        this.dispatchEvent("remove");
    };

    EventDispatcher.implementation(Shape.prototype);

    return Shape;

})();

var Bitmap = (function(parent){

    function Bitmap(){}

    Bitmap.prototype = new parent;

    Bitmap.prototype.constructor = Bitmap;

    Bitmap.prototype.setImage = function(image){
        this.image = image;
        this.w = image.width;
        this.h = image.height;
    };

    Bitmap.prototype.draw = function(){
		this.context.drawImage(this.image, this.x, this.y, this.w, this.h);

		if(this._opacity !== void 0 || this._opacity < 100){
			var imageData = this.context.getImageData(this.x, this.y, this.w, this.h);

			for(var i = 3; i < imageData.data.length; i+=4){
				if(imageData.data[i] == 0) continue;
				if(imageData.data[i] < this._opacity) continue;
				imageData.data[i] = this._opacity;
			}
			this.context.putImageData(imageData, this.x, this. y);
		}
    };

	Bitmap.prototype.opacity = function(opacity){
		this._opacity = Math.valueOfpercent(this._opacityValue = opacity, 255);
	};

    return Bitmap;

})(Shape);

var Sprite = (function(parent){

	function Sprite(){

	}

	Sprite.prototype = new parent;

	Sprite.prototype.constructor = Sprite;

	Sprite.prototype.setFrames = function(x, y, time){
        this.frameSize = [x || 1, y || 1];
		this.frames = new Array(this.frameSize[0] * this.frameSize[1]);
		this.currentFrame = 0;
		this.changeFrimeTime = time || 10;
		this.lastChange = Date.now();
	};

	Sprite.prototype.setImage = function(image){
		parent.prototype.setImage.call(this, image);
		var i = 0, y = 0, x = 0,
            width = parseInt(image.width / this.frameSize[0]),
            height = parseInt(image.height / this.frameSize[1]);
		this.w = width;
		this.h = height;
		for(i; i < this.frames.length; i++){
            if(i !== 0 && i % (this.frameSize[0] - 1) == 0) {y++, x = 0};
            this.frames[i] = {x: width*x, y: height*y, w: width, h: height};
            x++;
        }
	};

	Sprite.prototype.draw = function(){
		var frame = this.frames[this.currentFrame];
		this.context.drawImage(this.image, frame.x, frame.y, frame.w, frame.h, this.x, this.y, this.w, this.h);
	};

	Sprite.prototype.animate = function(infinite){
		var _this = this;
		if(Date.now() - this.lastChange < this.changeFrimeTime) return;
		this.lastChange = Date.now();
		if(_this.currentFrame === _this.frames.length - 1)
			if(infinite) { _this.currentFrame = -1; } else { return this.dispatchEvent("animationEnd"); }
		_this.currentFrame += 1;
	};

	EventDispatcher.implementation(Sprite);

	return Sprite;

})(Bitmap);

var Ship = (function(parent){

    function Ship(){
        this.easingAmount = 0.05;
        this.blinkSpeed = 5;
		this.blinkOpacity = 35;
		this.blinkFrom = 20;
		this.blinkTo = 100;
		this.appear = false;
		this.bullets = [];
        this.fullHealt = 2;
        this.fullLifes = 3;
        this.restorTime = 2000;
        this.invulnerableTime = 3*1000;
        this.shootingInterval = 300;
    }

    Ship.prototype = new parent;

    Ship.prototype.constructor = Ship;

    Ship.prototype.reset = function(){
        this.setImage(this.shipImage);
        this.invulnerable = true;
        this.destroyed = false;
        this._explode = false;
        this._collided = false;
        this.healt = this.fullHealt;
        this._startTime = Date.now();
        this.x = this.stage.w * 0.5 - this.w * 0.5;
        this.y = this.stage.h - this.h * 1.5;
        this.moveTo(this.x, this.y);
        this.shot();
        this.createExplosion();
    };

    Ship.prototype.createExplosion = function(){
        var _this = this;
        this.explosion = new Sprite();
        this.explosion.setFrames(5, 5, 20);
        this.explosion.setImage(this._explosionImage);
        this.explosion.addEventListener("animationEnd",function(){
            this.remove();
            _this.dispatchEvent("destroyed");
        });
    };

    Ship.prototype.setImages = function(ship, damagedShip, explosion, life){
        this.setImage(this.shipImage = ship);
        this._damagedShipImage = damagedShip;
        this._explosionImage = explosion;
        this._lifeImage = life;
        this.lifes = new Lifes(this.fullLifes);
        this.lifes.x = this.lifes.y = 20;
        this.lifes.setStage(this.stage);
        this.lifes.setImage(this._lifeImage);

        this.addEventListener("destroyed", function(){
            var _this = this;
            this.destroyed = true;
            this.lifes.remove();
            setTimeout(function(){
                if(_this.lifes.lifes == 0) return _this.remove();
            }, 100);
            if(_this.lifes.lifes > 0)
                setTimeout(function(){
                    _this.reset();
                }, this.restorTime);
        });
        this.addEventListener("collide", function(shape){
            if(shape instanceof Enemy){
                this.damage(1);
            }
            if(shape instanceof Bullet){
                this.damage(shape.value);
            }
        });
    };

	Ship.prototype.setBulletImages = function(image, explosionImage){
		this._bulletImage = image;
        this._bulletExplosionImage = explosionImage;
	};

    Ship.prototype.damage = function(value){
        if(this.destroyed) return;
        if(this.invulnerable) return;
        this.healt -= value;
        if(this.healt < this.fullHealt){
            this.setImage(this._damagedShipImage);
        }
        if(this.healt <= 0){
            this._explode = true;
            this.explosion.x = (this.x + this.w * 0.5) - this.explosion.w * 0.5;
            this.explosion.y = (this.y + this.h * 0.5) - this.explosion.h * 0.5;
            this.x = -this.w;
            this.y = -this.h;
            this.stage.addChild(this.explosion);
        }
    };

    Ship.prototype.exploding = function(){
        if(this._explode && !this.destroyed) this.explosion.animate();
    };

	Ship.prototype.setShieldImage = function(image){
		this.shield = new Bitmap();
		this.shield.setImage(this._shieldImage = image);
		this.shield.x = -this.shield.w;
		this.shield.y = -this.shield.h;
		this.stage.addChild(this.shield);
	};

    Ship.prototype.moveTo = function(x, y){
		if(x < 0) x = 0;
		if(x > this.stage.w - this.w) x = this.stage.w - this.w;
		if(y < 0) y = 0;
		if(y > this.stage.h - this.h) y = this.stage.h - this.h;
        this.moveX = x;
        this.moveY = y;
    };

    Ship.prototype.move = function(enemies){
        if(this.destroyed || this._explode) return;
        var _this = this;
        var xDistance = this.moveX - this.x;
        var yDistance = this.moveY - this.y;
        var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

        if (distance > 1) {
            this.x += xDistance * this.easingAmount;
            this.y += yDistance * this.easingAmount;
        }
        enemies.forEach(function(enemy){
            _this.collide(enemy);
        });
    };

	Ship.prototype.showShield = function(){
		this.shield.x = (this.x + this.w * 0.5) - this.shield.w * 0.5;
		this.shield.y = (this.y + this.h * 0.5) - this.shield.h * 0.65;
	};

	Ship.prototype.hideShield = function(){
		this.shield.x = -this.shield.w;
		this.shield.y = -this.shield.h;
	};

    Ship.prototype.removeBullet = function(bullet){
        var index = this.bullets.indexOf(bullet);
        if(index > -1) this.bullets.splice(index, 1);
    };

	Ship.prototype.blinking = function(){
		if(!this.invulnerable && this.appear) return;
		if(Date.now() - this._startTime >= this.invulnerableTime){
			this.invulnerable = false;
			this.hideShield();
			return this.opacity(100);
		}
		if(this.blinkOpacity >= this.blinkTo){
			this.appear = true;
		}else if (this.blinkOpacity <= this.blinkFrom){
			this.appear = false;
		}
		if(this.appear){
			this.blinkOpacity -= this.blinkSpeed;
		}else{
			this.blinkOpacity += this.blinkSpeed;
		}
		this.showShield();
		this.opacity(this.blinkOpacity);
	};

    Ship.prototype.shot = function(){
        if(this.removed) return;
        var _this = this, bullet = new Bullet();
        this.lastShoot = Date.now();
        this.stage.addChild(bullet);
        bullet.setImage(this._bulletImage);
        bullet.setExplosionImage(this._bulletExplosionImage);

        bullet.x = (this.x - bullet.w * 0.5) + this.w * 0.5;
        bullet.y = this.y - bullet.h;
        bullet.moveTo(bullet.x, -bullet.h * 2);
        bullet.addEventListener("gone", function(){
            _this.removeBullet(this);
            this.stage.removeChild(this);
        });
        bullet.addEventListener("remove", function(){
            _this.removeBullet(this);
        });
        this.bullets.push(bullet);
    };

    Ship.prototype.shooting = function(enemies){
        if(Date.now() - this.lastShoot > this.shootingInterval){
            this.shot();
        }

        this.bullets.forEach(function(bullet){
            bullet.move(enemies);

            bullet.exploding();
        });
    };

    return Ship;

})(Bitmap);

var Lifes = (function(){

    function Lifes(lifes){
        this.lifes = lifes || 0;
        this.x = 0;
        this.y = 0;
        this.bitmaps = [];
    }

    Lifes.prototype.setStage = function(stage){
        this.stage = stage;
    };

    Lifes.prototype.setImage = function(image){
        var i = 0;
        this.image = image;
        for(i; i < this.lifes; i++){
            this.createBitmap(i);
        }
    };

    Lifes.prototype.add = function(){
        this.createBitmap(this.lifes++);
    };

    Lifes.prototype.createBitmap = function(index){
        var bitmap = new Bitmap();
        bitmap.setImage(this.image);
        bitmap.x = (this.x + bitmap.w * index) + (10 * index);
        bitmap.y = this.y;
        this.stage.addChild(bitmap);
        this.bitmaps.push(bitmap);
    };

    Lifes.prototype.remove = function(){
        this.lifes--;
        this.stage.removeChild(this.bitmaps.pop());
    };

    return Lifes;

})();

var Bullet = (function(parent){

    function Bullet(){
        this.easingAmount = 0.15;
        this.step = 35;
        this.value = 1;
    }

    Bullet.prototype = new parent;

    Bullet.prototype.constructor = Bullet;

    Bullet.prototype.setExplosionImage = function(image){
        var _this = this;
        this.explosion = new Bitmap();
        this.explosion.setImage(image);
        this.explosion.addEventListener("remove", function(){
            _this.remove();
        });
    };

    Bullet.prototype.moveTo = function(x, y){
        var _this = this;
        this.moveX = x;
        this.moveY = y;
        var xDistance = this.moveX - this.x;
        var yDistance = this.moveY - this.y;
        this.stepX = xDistance > 0 ? this.step : xDistance < 0 ? -this.step : 0;
        this.stepY = yDistance > 0 ? this.step : yDistance < 0 ? -this.step : 0;
        this.addEventListener("collide", function(shape){
            if(shape instanceof Enemy){
                _this.explode();
            }
        });
    };

    Bullet.prototype.explode = function(){
        this.stage.addChild(this.explosion);
        this.explosion.x = (this.x + this.w * 0.5) - this.explosion.w * 0.5;
        this.explosion.y = this.y - (this.explosion.h * 0.5);
        this._explode = true;
        this.x = -this.w;
        this.y = -this.h;
        this.explosion.showTime = Date.now();
    };

    Bullet.prototype.exploding = function(){
        if(!this._explode) return;
        if(Date.now() - this.explosion.showTime < 100) return;
        this.explosion.remove();
    };

    Bullet.prototype.move = function(enemies){
        var _this = this;
        var xDistance = this.moveX - this.x;
        var yDistance = this.moveY - this.y;
        var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

        if (distance > this.step) {
            this.x += this.stepX;
            this.y += this.stepY;
        }else{
            this.explosion.remove();
        }
        enemies.forEach(function(enemy){
            _this.collide(enemy);
        });
    };

    return Bullet;

})(Bitmap);

var Enemy = (function(parent){

    function Enemy(){
        this.step = 15;
        this.healt = 1;
    }

    Enemy.prototype = new parent;

    Enemy.prototype.constructor = Bullet;

	Enemy.prototype.setExplosionImage = function(image){
		var _this = this;
		this.explosion = new Sprite();
		this.explosion.setFrames(10, 1, 50);
		this.explosion.setImage(image);
		this.explosion.addEventListener("animationEnd", function(){
			_this.stage.removeChild(_this.explosion);
            _this.dispatchEvent("remove");
            this.remove();
		});
	};

    Enemy.prototype.damage = function(value){
        this.healt -= value;
        if(this.healt <= 0){
            this.explode();
        }
    };

	Enemy.prototype.explode = function(){
		this.stage.addChild(this.explosion);
        this.explosion.x = (this.x + this.w * 0.5) - this.explosion.w * 0.5;
        this.explosion.y = (this.y + this.h * 0.5) - this.explosion.h * 0.5;
        this._explode = true;
        this.x = -this.w;
        this.y = -this.y;
	};

    Enemy.prototype.exploding = function(){
        if(this._explode){ this.explosion.animate();}
    };

    Enemy.prototype.moveTo = function(x, y){
        this.moveX = x;
        this.moveY = y;
        var xDistance = this.moveX - this.x;
        var yDistance = this.moveY - this.y;
        this.stepX = xDistance > 0 ? this.step : xDistance < 0 ? -this.step : 0;
        this.stepY = yDistance > 0 ? this.step : yDistance < 0 ? -this.step : 0;
    };

    Enemy.prototype.move = function(enemies){
        var xDistance = this.moveX - this.x;
        var yDistance = this.moveY - this.y;
        var distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);

        if (distance > this.step) {
            this.x += this.stepX;
            this.y += this.stepY;
        }else{
            this.remove();
        }
        this.collide(enemies);
    };

    return Enemy;

})(Bitmap);

var Enemies = (function(){

    function Enemies(stage){
        this.stage = stage;
        this.enemies = [];
    }

    Enemies.prototype.create = function(){
        var _this = this;
        (function action(){
            var enemy = new Enemy();
            enemy.setImage(_this.image);
            enemy.setExplosionImage(_this.explosionImage);

            enemy.x = Math.getRandomInt(0, _this.stage.w - enemy.w);
            enemy.y = -enemy.h;
            enemy.step = Math.getRandomInt(5, 8);
            enemy.moveTo(enemy.x, _this.stage.h + enemy.h);

            enemy.addEventListener("remove", function(){
                _this.removeEnemy(this);
                this.stage.removeChild(this);
            });
            enemy.addEventListener("collide", function(shape){
                if(shape instanceof Bullet){
                    this.damage(shape.value);
                }
            });
            _this.stage.addChild(enemy);
            _this.enemies.push(enemy);

            setTimeout(action, Math.getRandomInt(500, 2000))
        })();
    };

	Enemies.prototype.setImage = function(image){
		this.image = image;
	};

	Enemies.prototype.setExplosionImage = function(image){
		this.explosionImage = image;
	};

    Enemies.prototype.forEach = function(callback){
        this.enemies.forEach(callback);
    };

    Enemies.prototype.removeEnemy = function(enemy){
        var index = this.enemies.indexOf(enemy);
        if(index > -1) this.enemies.splice(index, 1);
    };

    Enemies.prototype.move = function(){
        this.enemies.forEach(function(enemy){
            enemy.move();
            enemy.exploding();
        });
    };

    return Enemies;

})();