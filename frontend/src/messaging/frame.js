define(['messaging/message'], function(Message) {
	var schema = {
		id: 1,
		format: ['id', 'x', 'y', 'direction', 'state'],
		byteformat: 'IffBB'
	};

	var FrameMessage = Message.from(schema);
	return FrameMessage;
});