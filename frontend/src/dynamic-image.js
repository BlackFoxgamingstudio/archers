define(['lodash', 'pc'], function(_, pc) {
	return pc.Image.extend('pc.Image.Dynamic',
		{},
		{
			// @TODO: optimise (single array pass etc.)
			init: function (name, sources, dimensions) {
				var canvas, ctx, image, images = [];

				images = _.map(sources, function(source) {
					return pc.device.loader.get(source).resource;
				});

				if(!dimensions) {
					dimensions = {};
					_.each(images, function(image) {
						dimensions.width = dimensions.width > image.width ? dimensions.width : image.width;
						dimensions.height = dimensions.height > image.height ? dimensions.height : image.height;
					});
				}

				this.image = canvas = document.createElement('canvas');

				this.width = canvas.width = dimensions.width;
				this.height = canvas.height = dimensions.height;
				ctx = canvas.getContext('2d');

				_.each(images, function(image) {
					ctx.drawImage(image.image, 0,0);
				});

				this.name = name;
				this.scaleX = 1;
				this.scaleY = 1;
				this.alpha = 1;
				this.loaded = true;
			},

			load: function() {
				// no need for that sir
			}
		}
	)
});