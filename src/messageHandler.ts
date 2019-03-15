import { Channel, Message } from 'amqplib/callback_api';
import { QueueTask } from './types';

export default (channel: Channel, handler: QueueTask) => async (message: Message) => {
    if (message) {
        try {
            await handler(JSON.parse(message.content.toString()));
            channel.ack(message);
        } catch (e) {
            channel.reject(message, false);
        }
    }
};
