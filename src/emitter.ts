import { connect, createChannel, messagePublisher } from './broker';
import { getEnv } from './getEnv';
import { log } from 'console';

const brokerUrl = getEnv('MESSAGE_BROKER_URL');

const emit = async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const connection = await connect(brokerUrl);
        const channel = await createChannel(connection);

        const pushUpdate = messagePublisher(channel, 'PUBLISHING', 'update');
        for (let id = 0; id < 1000; id += 1) {
            pushUpdate({ id, hello: 'hello' });
            await sleep(1000);
        }

    } catch (error) {
        log(error);
        process.exit(1);
    }
};

emit();
