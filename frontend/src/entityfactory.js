define(['pc',
	'lodash',
	'spritedef/archer',
	'spritedef/arrow',
	'spritedef/skeleton',
	'components/state',
	'components/meta',
	'components/network',
	'composite-image',
	'filtered-image'],
	function(pc, _, archerSpritedef, arrowSpritedef, skeletonSpritedef, stateComponent, metaComponent, networkComponent, CompositeImage, FilteredImage) {
	var EntityFactory = pc.EntityFactory.extend('pc.archers.EntityFactory', {}, {

		getDynamicSprite: function(selected, spriteDef, animationState) {
			var data = pc.device.loader.get('items').resource.data,
				keys = _.keys(selected).sort(),
				layers = [],
				gender = selected['gender'],
				image, ss;


			delete selected['gender'];
			_.each(keys, function(key) {
				var selectedItem = selected[key],
					ssSpec, selectedVariant, layerImage;

				if(_.isArray(selectedItem)) {
					selectedVariant = selectedItem[1];
					selectedItem = selectedItem[0];
				}

				if(selectedItem && data.items[selectedItem].spritesheet) {
					ssSpec = data.items[selectedItem].spritesheet;

					if(_.isObject(ssSpec) && ssSpec[gender]) {
						ssSpec = ssSpec[gender];
					}
					if(selectedVariant) {
						layerImage = new FilteredImage("", ssSpec, data.items[selectedItem].variants[selectedVariant]);
					}

					if(layerImage) {
						layers.push(layerImage);
					} else {
						layers = layers.concat(ssSpec);
					}
				}
			});


			image = new CompositeImage("", layers);
			ss = new pc.SpriteSheet({
				image: image,
				frameWidth: spriteDef.frameWidth,
				frameHeight: spriteDef.frameHeight
			});

			// TODO: deduplicate common code with getSprite
			animationState = animationState || spriteDef.frameDefault;
			_.each(spriteDef.frames, function(a) {
				ss.addAnimation(a);
			});



			return pc.components.Sprite.create({
				spriteSheet:ss,
				animationStart: animationState
			});
		},
		// animationState to be automated based on state and dir
		getSprite: function(spriteDef, animationState) {
			var spriteImage = pc.device.loader.get(spriteDef.spriteName).resource,
				ss = new pc.SpriteSheet({
					image: spriteImage,
					frameWidth: spriteDef.frameWidth,
					frameHeight: spriteDef.frameHeight
				});

			animationState = animationState || spriteDef.frameDefault;

			_.each(spriteDef.frames, function(a) {
				ss.addAnimation(a);
			});

			return pc.components.Sprite.create({
				spriteSheet:ss,
				animationStart: animationState
			});
		},

		getSpatial: function(x, y, width, height) {
			return pc.components.Spatial.create({
				x:x-0.5*width,
				y:y-0.5*height,
				w:width,
				h:height
			});
		},

		getInput: function() {
			return pc.components.Input.create({
					states:[
						['moving right', ['D', 'RIGHT']],
						['moving left', ['A', 'LEFT']],
						['moving up', ['W', 'UP']],
						['moving down', ['S', 'DOWN']],
						['attacking', ['SPACE']]
					]
			});
		},

		makeCollidable: function(layer, x, y, dir, shape, props) {
			var spatial = this.getSpatial(x, y, shape.x, shape.y),
				entity = pc.Entity.create(layer);

			entity.addComponent(spatial);
			return entity;
		},

		makeArcher: function(layer, x, y, dir, shape, props) {
			var spatial = this.getSpatial(x, y, 64, 64),
				state = stateComponent.create(props.state, dir),
				meta = metaComponent.create(),
				sprite = this.getSprite(archerSpritedef, state.getStatedir()),
				entity = pc.Entity.create(layer),
				network = networkComponent.create();

			entity.addComponent(state);
			entity.addComponent(meta);
			entity.addComponent(spatial);
			entity.addComponent(sprite);
			entity.addComponent(network);

			if(props.player) {
				entity.addTag('PLAYER');
			}

			return entity;
		},

		makeSkeleton: function(layer, x, y, dir, shape, props) {
			var spatial = this.getSpatial(x, y, 64, 64),
				state = stateComponent.create(props.state, dir),
				meta = metaComponent.create(),
				sprite = this.getSprite(skeletonSpritedef, state.getStatedir()),
				entity = pc.Entity.create(layer),
				network = networkComponent.create();


			entity.addComponent(state);
			entity.addComponent(meta);
			entity.addComponent(spatial);
			entity.addComponent(sprite);
			entity.addComponent(network);

			return entity;
		},

		makeArrow: function(layer, x, y, dir, shape, props) {
			var spatial = this.getSpatial(x, y, 32, 32),
				state = stateComponent.create(props.state, dir),
				sprite = this.getSprite(arrowSpritedef, state.getStatedir()),
				entity = pc.Entity.create(layer),
				network = networkComponent.create();

			entity.addComponent(spatial);
			entity.addComponent(sprite);
			entity.addComponent(network);

			return entity;
		},

		createEntity: function(layer, type, x, y, dir, point, properties) {
			var factoryMethod = 'make'+type.charAt(0).toUpperCase()+type.slice(1),
				entity;

			if(this[factoryMethod]) {
				entity = this[factoryMethod].call(this, layer, x, y, dir, point, properties);
				entity.addTag(type);
				return entity;
			} else {
				return null;
			}
		}
	});
	return EntityFactory;
});
