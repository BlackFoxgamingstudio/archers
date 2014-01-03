define(function() {
	return {
			entityTypeLookup: {
				0: 'unknown',
				1: 'collidable',
				2: 'archer',
				3: 'arrow',
				4: 'skeleton',
				5: 'CopperCoin',
				6: 'SilverCoin',
				7: 'GoldCoin'
			},

			hydrateEntityType: function(value) {
				return this.entityTypeLookup[value];
			}
			//@TODO: dehydrate for completness sake
	};
});