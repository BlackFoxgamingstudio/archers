from archers.utils import EventsMixins
from archers.world import rotations
import struct

# B	unsigned char	integer	1	(3)
# ?	_Bool	bool	1	(1)
# H	unsigned short	integer	2	(3)
# I	unsigned int	integer	4	(3)
# Q	unsigned long long	integer	8	(2), (3)
# f	float


class Message(dict):
	def __init__(self, *args, **kwargs):
		if(args):
			self.hydrate(args[0])

	@classmethod
	def from_dehydrated(class_, data):
		item = class_()
		for idx, key in enumerate(item.schema_item):
			value = data[idx]

			if(hasattr(item, 'hydrate_%s' % key)):
				hydrator = getattr(item, 'hydrate_%s' % key)
				if(hasattr(hydrator, '__call__')):
					value = hydrator(value)
			item[key] = value
		return item

	def dehydrate(self):
		dehydrated = list()
		for key in self.schema_item:
			value = self.get(key, 0)
			if(hasattr(self, 'dehydrate_%s' % key)):
				hydrator = getattr(self, 'dehydrate_%s' % key)
				if(hasattr(hydrator, '__call__')):
					value = hydrator(value)
			dehydrated.append(value)
		return dehydrated

	def pack(self):
		dehydrated = self.dehydrate()
		buffer_ = struct.pack(self.schema_item_format, *dehydrated)
		return buffer_

	@classmethod
	def from_packed(class_, data):
		buffer_ = buffer(data)
		item = struct.unpack_from(class_.schema_item_format, buffer_)
		item = list(item)
		return class_.from_dehydrated(item)


	# @classmethod
	# def from_packed(class_, data):
	# 	items = list()
	# 	item_size = struct.calcsize(class_.schema_item_format)
	# 	pointer = 0
	# 	buffer_ = buffer(data)
	# 		item_buffer = buffer_[pointer:pointer+item_size]
	# 		pointer = pointer+item_size
	# 		item = struct.unpack_from(class_.schema_item_format, item_buffer)
	# 		items.append(list(item))
	# 	return class_.from_dehydrated(items)


class UpdateMessage(Message):
	schema_key = 'id'
	schema_item = ['id', 'center']
	schema_item_format = 'I?'

#  TODO: more clever, general lookup-mixin?
class DirectionMessageMixin(object):
	direction_lookup = {
		rotations['north']: 1,
		rotations['south']: 2,
		rotations['east']: 3,
		rotations['west']: 4,
	}

	direction_reverse_lookup = {
		1: rotations['north'],
		2: rotations['south'],
		3: rotations['east'],
		4: rotations['west'],
	}

	def hydrate_direction(self, value):
		return self.direction_reverse_lookup.get(value, None)

	def dehydrate_direction(self, value):
		return self.direction_lookup.get(value, 0)


class FrameMessage(Message, DirectionMessageMixin):
	schema_key = 'id'
	schema_item = ['id', 'x', 'y', 'direction', 'state']
	schema_item_format = 'IffBB'


class UserActionMessage(Message, DirectionMessageMixin):
	schema_item = ['action', 'direction']
	schema_item_format = 'BB'

	action_lookup = {
		'stand': 1,
		'move': 2,
		'attack': 3
	}

	action_reverse_lookup = {
		1: 'stand',
		2: 'move',
		3: 'attack'
	}

	def hydrate_action(self, value):
		return self.action_reverse_lookup.get(value, None)

	def dehydrate_action(self, value):
		return self.action_lookup.get(value, 0)


class Connection(EventsMixins):
	def __init__(self, world):
		self.world = world
		self.known = dict()
		self.last_world_index = 0
		self.last_frame_index = 0
		self.world.on('step', self.on_update)
		self.world.on('step', self.frame_maybe)

	def on_update(self, world):
		if(self.last_world_index != world.object_index.index):
			messages = list()
			for index in range(self.last_world_index, world.object_index.index):
				index = index+1
				world_object = world.get_object_by_id(index)
				if(hasattr(world_object, 'physics')):
					msg = UpdateMessage()
					# msg['name'] = world_object.name
					msg['id'] = world_object.id
					msg['center'] = False
					messages.append(msg)
				self.last_world_index = index
			self.trigger('update', messages)

	def frame_maybe(self, world):
		self.trigger('frame', self.get_frame())

	# redundant, just reset the counter on_update?
	# def get_full_update(self):
	# 	update = UpdateMessage()
	# 	for item in self.world.object_index.values():
	# 		if(hasattr(item, 'physics')):
	# 			data = dict()
	# 			data['name'] = item.name
	# 			data['id'] = item.id
	# 			data['center'] = False
	# 			update[item.id] = data
	# 	return update

	def get_frame(self, updated_only=True):
		update = list()

		for item in self.world.object_index.values():
			if(hasattr(item, 'physics')):
				data = FrameMessage()
				data['id'] = item.id
				data['x'] = item.physics.position.x
				data['y'] = item.physics.position.y
				data['direction'] = item.physics.angle
				data['state'] = 0
				if not(item in self.known.keys() and self.known[item] == data):
					update.append(data)
					self.known[item] = data
		return update
